/**
 * Concurrent User Authentication Load Testing
 * Tests system behavior under concurrent authentication scenarios
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { CONCURRENT_USER_SCENARIOS, type LoadTestReport } from '../config/load-test-config'
import { LoadTestReporter } from '../utils/load-test-reporter'
import { SystemResourceMonitor } from '../utils/resource-monitor'
import { BehaviorAnalyzer, UserSimulator } from '../utils/user-simulator'

describe('Concurrent User Authentication Load Tests', () => {
  const userSimulator = new UserSimulator()
  const resourceMonitor = new SystemResourceMonitor()
  const reporter = new LoadTestReporter()
  const testReports: LoadTestReport[] = []

  beforeAll(async () => {
    // Ensure API server is running
    try {
      const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:8787'}/health`)
      if (!response.ok) {
        throw new Error('API server is not responding correctly')
      }
      console.log('✅ API server is running and healthy')
    } catch (error) {
      console.error(
        '❌ API server is not available. Please start the server before running load tests.'
      )
      throw error
    }

    // Start resource monitoring
    await resourceMonitor.start()
  })

  afterAll(async () => {
    // Stop resource monitoring
    await resourceMonitor.stop()

    // Generate consolidated report
    await reporter.generateConsolidatedReport(testReports, 'concurrent-auth-tests')

    console.log(`\n=== Load Test Summary ===`)
    console.log(`Total scenarios executed: ${testReports.length}`)
    console.log(`All reports saved to: ${reporter.getOutputDirectory()}`)
  })

  describe('Authentication Flow Load Tests', () => {
    it('should handle small team concurrent authentication (10 users)', async () => {
      const scenario = CONCURRENT_USER_SCENARIOS.find(s => s.name === 'small-team')!
      console.log(`\n🔐 Running small team auth test: ${scenario.description}`)

      const report = await runAuthenticationLoadTest(scenario)
      testReports.push(report)

      // Assert requirements
      expect(report.summary.successRate).toBeGreaterThan(scenario.requirements.minSuccessRate)
      expect(report.summary.p95ResponseTime).toBeLessThan(scenario.requirements.maxP95ResponseTime)
      expect(report.summary.throughput).toBeGreaterThan(scenario.requirements.minThroughput)
      expect(report.summary.errorRate).toBeLessThan(scenario.requirements.maxErrorRate)

      console.log('✅ Small team authentication test completed successfully')
    })

    it('should handle medium team concurrent authentication (50 users)', async () => {
      const scenario = CONCURRENT_USER_SCENARIOS.find(s => s.name === 'medium-team')!
      console.log(`\n🔐 Running medium team auth test: ${scenario.description}`)

      const report = await runAuthenticationLoadTest(scenario)
      testReports.push(report)

      // Assert requirements
      expect(report.summary.successRate).toBeGreaterThan(scenario.requirements.minSuccessRate)
      expect(report.summary.p95ResponseTime).toBeLessThan(scenario.requirements.maxP95ResponseTime)
      expect(report.summary.throughput).toBeGreaterThan(scenario.requirements.minThroughput)
      expect(report.summary.errorRate).toBeLessThan(scenario.requirements.maxErrorRate)

      console.log('✅ Medium team authentication test completed successfully')
    })

    it('should handle large team concurrent authentication (100 users)', async () => {
      const scenario = CONCURRENT_USER_SCENARIOS.find(s => s.name === 'large-team')!
      console.log(`\n🔐 Running large team auth test: ${scenario.description}`)

      const report = await runAuthenticationLoadTest(scenario)
      testReports.push(report)

      // Assert requirements
      expect(report.summary.successRate).toBeGreaterThan(scenario.requirements.minSuccessRate)
      expect(report.summary.p95ResponseTime).toBeLessThan(scenario.requirements.maxP95ResponseTime)
      expect(report.summary.throughput).toBeGreaterThan(scenario.requirements.minThroughput)
      expect(report.summary.errorRate).toBeLessThan(scenario.requirements.maxErrorRate)

      console.log('✅ Large team authentication test completed successfully')
    })

    it('should handle enterprise scale concurrent authentication (500 users)', async () => {
      const scenario = CONCURRENT_USER_SCENARIOS.find(s => s.name === 'enterprise-scale')!
      console.log(`\n🔐 Running enterprise scale auth test: ${scenario.description}`)

      const report = await runAuthenticationLoadTest(scenario)
      testReports.push(report)

      // Assert requirements
      expect(report.summary.successRate).toBeGreaterThan(scenario.requirements.minSuccessRate)
      expect(report.summary.p95ResponseTime).toBeLessThan(scenario.requirements.maxP95ResponseTime)
      expect(report.summary.throughput).toBeGreaterThan(scenario.requirements.minThroughput)
      expect(report.summary.errorRate).toBeLessThan(scenario.requirements.maxErrorRate)

      console.log('✅ Enterprise scale authentication test completed successfully')
    })
  })

  describe('Authentication Stress Tests', () => {
    it('should handle authentication stress test (1000 users)', async () => {
      const scenario = CONCURRENT_USER_SCENARIOS.find(s => s.name === 'stress-test')!
      console.log(`\n💪 Running authentication stress test: ${scenario.description}`)

      const report = await runAuthenticationLoadTest(scenario)
      testReports.push(report)

      // Stress test requirements are more lenient
      expect(report.summary.successRate).toBeGreaterThan(scenario.requirements.minSuccessRate)
      expect(report.summary.p95ResponseTime).toBeLessThan(scenario.requirements.maxP95ResponseTime)

      console.log('✅ Authentication stress test completed successfully')
    })

    it('should handle authentication endurance test (100 users, 1 hour)', async () => {
      const scenario = CONCURRENT_USER_SCENARIOS.find(s => s.name === 'endurance-test')!
      console.log(`\n⏱️ Running authentication endurance test: ${scenario.description}`)

      const report = await runAuthenticationLoadTest(scenario)
      testReports.push(report)

      // Endurance test should maintain stability
      expect(report.summary.successRate).toBeGreaterThan(scenario.requirements.minSuccessRate)
      expect(report.summary.p95ResponseTime).toBeLessThan(scenario.requirements.maxP95ResponseTime)

      // Check for performance degradation over time
      const performanceDegradation = analyzePerformanceDegradation(report)
      expect(performanceDegradation).toBeLessThan(
        0.3,
        'Performance degradation should be less than 30%'
      )

      console.log('✅ Authentication endurance test completed successfully')
    })
  })

  describe('Session Management Load Tests', () => {
    it('should handle concurrent session creation and validation', async () => {
      console.log('\n🔄 Testing concurrent session management...')

      const userCount = 100
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:8787'

      // Generate users
      const users = userSimulator.generateUsers(userCount, 'moderate')

      // Create sessions concurrently
      const sessionPromises = users.map(async (user, index) => {
        const delay = index * 50 // Stagger session creation by 50ms
        await new Promise(resolve => setTimeout(resolve, delay))

        const session = userSimulator.createSession(user)
        return session.start(baseUrl, 60000) // 1 minute session
      })

      const sessionMetrics = await Promise.all(sessionPromises)

      // Analyze session management performance
      const analysis = BehaviorAnalyzer.analyzeBehavior(userSimulator.getActiveSessions())

      console.log('Session Management Results:')
      console.log(`  Total sessions created: ${sessionMetrics.length}`)
      console.log(
        `  Average session duration: ${analysis.sessionStats.averageDuration.toFixed(0)}ms`
      )
      console.log(
        `  Session success rate: ${(analysis.sessionStats.successRate * 100).toFixed(1)}%`
      )

      // Assert session management requirements
      expect(analysis.sessionStats.successRate).toBeGreaterThan(0.95)
      expect(analysis.totalErrors).toBeLessThan(userCount * 0.05) // Less than 5% errors

      console.log('✅ Concurrent session management test completed successfully')
    })

    it('should handle session expiration and cleanup under load', async () => {
      console.log('\n🧹 Testing session expiration and cleanup...')

      const userCount = 50
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:8787'
      const shortSessionDuration = 10000 // 10 seconds

      // Generate users
      const users = userSimulator.generateUsers(userCount, 'light')

      // Create short-lived sessions
      const sessionPromises = users.map(user => {
        const session = userSimulator.createSession(user)
        return session.start(baseUrl, shortSessionDuration)
      })

      await Promise.all(sessionPromises)

      // Wait for sessions to expire
      await new Promise(resolve => setTimeout(resolve, shortSessionDuration + 5000))

      // Test that expired sessions are properly handled
      const expiredSessionTest = users.slice(0, 10).map(async user => {
        try {
          const response = await fetch(`${baseUrl}/auth/validate`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${user.authToken}`,
            },
          })
          return response.status
        } catch {
          return 0
        }
      })

      const results = await Promise.all(expiredSessionTest)
      const unauthorizedCount = results.filter(status => status === 401).length

      console.log(`Session expiration test results:`)
      console.log(`  Expired sessions properly rejected: ${unauthorizedCount}/${results.length}`)

      // Most expired sessions should be rejected
      expect(unauthorizedCount).toBeGreaterThan(results.length * 0.8)

      console.log('✅ Session expiration and cleanup test completed successfully')
    })
  })

  /**
   * Run authentication load test for a given scenario
   */
  async function runAuthenticationLoadTest(scenario: any): Promise<LoadTestReport> {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:8787'
    const startTime = Date.now()

    console.log(
      `Starting ${scenario.name} with ${scenario.userCount} users for ${scenario.duration / 1000}s`
    )

    // Generate users for the scenario
    const users = userSimulator.generateUsers(scenario.userCount, 'moderate')

    // Gradually ramp up users
    const rampUpInterval = scenario.rampUpTime / users.length
    const sessionPromises: Promise<any>[] = []

    for (let i = 0; i < users.length; i++) {
      const user = users[i]

      setTimeout(() => {
        const session = userSimulator.createSession(user)
        sessionPromises.push(session.start(baseUrl, scenario.duration))
      }, i * rampUpInterval)
    }

    // Wait for all sessions to complete
    const sessionMetrics = await Promise.all(sessionPromises)

    // Collect final resource metrics
    const resourceMetrics = resourceMonitor.getMetrics()

    // Generate report
    const report = await reporter.generateReport({
      scenario: scenario.name,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      users: scenario.userCount,
      summary: calculateSummaryMetrics(sessionMetrics),
      endpoints: calculateEndpointMetrics(sessionMetrics),
      userBehavior: calculateBehaviorMetrics(sessionMetrics),
      resources: resourceMetrics,
      bottlenecks: identifyBottlenecks(sessionMetrics, resourceMetrics, scenario.requirements),
      recommendations: generateRecommendations(sessionMetrics, resourceMetrics, scenario),
    })

    console.log(`${scenario.name} completed:`)
    console.log(`  Requests: ${report.summary.totalRequests}`)
    console.log(`  Success Rate: ${(report.summary.successRate * 100).toFixed(1)}%`)
    console.log(`  P95 Response Time: ${report.summary.p95ResponseTime.toFixed(0)}ms`)
    console.log(`  Throughput: ${report.summary.throughput.toFixed(0)} req/s`)

    return report
  }

  /**
   * Calculate summary metrics from session metrics
   */
  function calculateSummaryMetrics(sessionMetrics: any[]) {
    const totalRequests = sessionMetrics.reduce((sum, metrics) => sum + metrics.totalRequests, 0)
    const successfulRequests = sessionMetrics.reduce(
      (sum, metrics) => sum + metrics.successfulRequests,
      0
    )
    const failedRequests = sessionMetrics.reduce((sum, metrics) => sum + metrics.failedRequests, 0)

    const allResponseTimes = sessionMetrics.flatMap(metrics =>
      metrics.actions.map((action: any) => action.responseTime)
    )
    allResponseTimes.sort((a, b) => a - b)

    const totalDuration = Math.max(...sessionMetrics.map(metrics => metrics.sessionDuration))

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime:
        allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length,
      p95ResponseTime: allResponseTimes[Math.floor(allResponseTimes.length * 0.95)] || 0,
      p99ResponseTime: allResponseTimes[Math.floor(allResponseTimes.length * 0.99)] || 0,
      throughput: totalRequests / (totalDuration / 1000),
      errorRate: failedRequests / totalRequests,
    }
  }

  /**
   * Calculate endpoint-specific metrics
   */
  function calculateEndpointMetrics(sessionMetrics: any[]) {
    const endpointStats = new Map()

    for (const metrics of sessionMetrics) {
      for (const action of metrics.actions) {
        const endpoint = getEndpointForAction(action.type)

        if (!endpointStats.has(endpoint)) {
          endpointStats.set(endpoint, {
            requests: 0,
            responseTimes: [],
            successes: 0,
            errors: new Map(),
          })
        }

        const stats = endpointStats.get(endpoint)
        stats.requests++
        stats.responseTimes.push(action.responseTime)
        if (action.success) {
          stats.successes++
        } else {
          const errorType = action.error || 'unknown'
          stats.errors.set(errorType, (stats.errors.get(errorType) || 0) + 1)
        }
      }
    }

    // Convert to required format
    const result: any = {}
    for (const [endpoint, stats] of endpointStats.entries()) {
      const responseTimes = stats.responseTimes.sort((a, b) => a - b)

      result[endpoint] = {
        requests: stats.requests,
        averageResponseTime:
          responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
        p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
        successRate: stats.successes / stats.requests,
        errors: Array.from(stats.errors.entries()).map(([type, count]) => ({
          type,
          count,
        })),
      }
    }

    return result
  }

  /**
   * Calculate user behavior metrics
   */
  function calculateBehaviorMetrics(sessionMetrics: any[]) {
    const behaviorStats = new Map()

    for (const metrics of sessionMetrics) {
      for (const action of metrics.actions) {
        if (!behaviorStats.has(action.type)) {
          behaviorStats.set(action.type, {
            count: 0,
            responseTimes: [],
            successes: 0,
          })
        }

        const stats = behaviorStats.get(action.type)
        stats.count++
        stats.responseTimes.push(action.responseTime)
        if (action.success) {
          stats.successes++
        }
      }
    }

    const result: any = {}
    const totalActions = Array.from(behaviorStats.values()).reduce(
      (sum, stats) => sum + stats.count,
      0
    )

    for (const [actionType, stats] of behaviorStats.entries()) {
      const responseTimes = stats.responseTimes.sort((a, b) => a - b)

      result[actionType] = {
        frequency: stats.count / totalActions,
        averageResponseTime:
          responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
        successRate: stats.successes / stats.count,
      }
    }

    return result
  }

  /**
   * Identify performance bottlenecks
   */
  function identifyBottlenecks(sessionMetrics: any[], resourceMetrics: any[], requirements: any) {
    const bottlenecks = []

    // Check response time bottlenecks
    const allResponseTimes = sessionMetrics.flatMap(metrics =>
      metrics.actions.map((action: any) => action.responseTime)
    )
    const p95ResponseTime = allResponseTimes.sort((a, b) => a - b)[
      Math.floor(allResponseTimes.length * 0.95)
    ]

    if (p95ResponseTime > requirements.maxP95ResponseTime) {
      bottlenecks.push({
        type: 'endpoint',
        target: 'overall',
        metric: 'p95_response_time',
        value: p95ResponseTime,
        threshold: requirements.maxP95ResponseTime,
        severity: p95ResponseTime > requirements.maxP95ResponseTime * 2 ? 'critical' : 'high',
      })
    }

    // Check resource bottlenecks
    const maxCpuUsage = Math.max(...resourceMetrics.map(m => m.cpu.usage))
    if (maxCpuUsage > 80) {
      bottlenecks.push({
        type: 'resource',
        target: 'cpu',
        metric: 'usage',
        value: maxCpuUsage,
        threshold: 80,
        severity: maxCpuUsage > 95 ? 'critical' : 'medium',
      })
    }

    const maxMemoryUsage = Math.max(...resourceMetrics.map(m => m.memory.percentage))
    if (maxMemoryUsage > 85) {
      bottlenecks.push({
        type: 'resource',
        target: 'memory',
        metric: 'usage',
        value: maxMemoryUsage,
        threshold: 85,
        severity: maxMemoryUsage > 95 ? 'critical' : 'high',
      })
    }

    return bottlenecks
  }

  /**
   * Generate performance recommendations
   */
  function generateRecommendations(sessionMetrics: any[], resourceMetrics: any[], _scenario: any) {
    const recommendations = []

    const allResponseTimes = sessionMetrics.flatMap(metrics =>
      metrics.actions.map((action: any) => action.responseTime)
    )
    const avgResponseTime =
      allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length

    if (avgResponseTime > 500) {
      recommendations.push(
        'Consider implementing response caching for frequently accessed endpoints'
      )
    }

    const maxCpuUsage = Math.max(...resourceMetrics.map(m => m.cpu.usage))
    if (maxCpuUsage > 80) {
      recommendations.push('Consider scaling up CPU resources or optimizing computational tasks')
    }

    const maxMemoryUsage = Math.max(...resourceMetrics.map(m => m.memory.percentage))
    if (maxMemoryUsage > 85) {
      recommendations.push('Investigate potential memory leaks and optimize memory usage')
    }

    const errorCount = sessionMetrics.reduce((sum, metrics) => sum + metrics.errors.length, 0)
    if (errorCount > sessionMetrics.length * 0.1) {
      recommendations.push('Review and improve error handling and retry mechanisms')
    }

    return recommendations
  }

  /**
   * Analyze performance degradation over time
   */
  function analyzePerformanceDegradation(report: LoadTestReport): number {
    // This is a simplified analysis - in a real implementation, you'd
    // analyze performance trends over the duration of the test
    const initialP95 = report.summary.p95ResponseTime
    const expectedP95 = 300 // Expected P95 for this type of test

    return Math.max(0, (initialP95 - expectedP95) / expectedP95)
  }

  /**
   * Get endpoint for action type
   */
  function getEndpointForAction(actionType: string): string {
    const endpointMap: Record<string, string> = {
      login: '/auth/login',
      profile_view: '/users/profile',
      json_format: '/tools/json/format',
      json_validate: '/tools/json/validate',
      json_convert: '/tools/json/convert',
      code_format: '/tools/code/format',
      code_execute: '/tools/code/execute',
      file_upload: '/upload/sign',
      file_download: '/upload/status',
      health_check: '/health',
    }

    return endpointMap[actionType] || '/unknown'
  }
})
