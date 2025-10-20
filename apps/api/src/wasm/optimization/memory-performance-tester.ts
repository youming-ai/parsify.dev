/**
 * Memory performance testing for WASM modules
 */

import { IWasmModule } from '../modules/interfaces/wasm-module.interface'
import { MemoryStats } from './memory-monitor'
import { WasmMemoryManager, MemoryUsage } from './memory-manager'

/**
 * Memory performance test configuration
 */
export interface MemoryPerformanceTestConfig {
  /**
   * Test duration in milliseconds
   */
  testDuration: number

  /**
   * Number of test iterations
   */
  iterations: number

  /**
   * Warmup iterations before actual testing
   */
  warmupIterations: number

  /**
   * Memory load pattern
   */
  loadPattern: 'constant' | 'burst' | 'gradual' | 'random' | 'realistic'

  /**
   * Maximum memory load in bytes
   */
  maxMemoryLoad: number

  /**
   * Memory allocation sizes (bytes)
   */
  allocationSizes: number[]

  /**
   * Allocation intervals in milliseconds
   */
  allocationIntervals: number[]

  /**
   * Deallocation probability (0-1)
   */
  deallocationProbability: number

  /**
   * Enable concurrent operations
   */
  enableConcurrency: boolean

  /**
   * Number of concurrent operations
   */
  concurrency: number

  /**
   * Enable memory stress testing
   */
  enableStressTest: boolean

  /**
   * Stress test multiplier
   */
  stressMultiplier: number

  /**
   * Enable leak simulation
   */
  enableLeakSimulation: boolean

  /**
   * Leak simulation probability (0-1)
   */
  leakProbability: number

  /**
   * Custom test scenarios
   */
  scenarios: TestScenario[]

  /**
   * Test timeout in milliseconds
   */
  timeout: number

  /**
   * Enable detailed metrics collection
   */
  enableDetailedMetrics: boolean

  /**
   * Metrics collection interval in milliseconds
   */
  metricsInterval: number
}

/**
 * Test scenario definition
 */
export interface TestScenario {
  name: string
  description: string
  setup: () => Promise<void>
  execute: () => Promise<void>
  cleanup: () => Promise<void>
  expectedMemoryUsage?: number
  maxExecutionTime?: number
  customMetrics?: Record<string, any>
}

/**
 * Memory performance metrics
 */
export interface MemoryPerformanceMetrics {
  /**
   * Test name
   */
  testName: string

  /**
   * Module ID
   */
  moduleId: string

  /**
   * Test duration in milliseconds
   */
  duration: number

  /**
   * Number of operations performed
   */
  operations: number

  /**
   * Operations per second
   */
  operationsPerSecond: number

  /**
   * Peak memory usage in bytes
   */
  peakMemoryUsage: number

  /**
   * Average memory usage in bytes
   */
  averageMemoryUsage: number

  /**
   * Memory allocated in bytes
   */
  totalMemoryAllocated: number

  /**
   * Memory deallocated in bytes
   */
  totalMemoryDeallocated: number

  /**
   * Memory leaked in bytes
   */
  memoryLeaked: number

  /**
   * Memory efficiency score (0-100)
   */
  memoryEfficiency: number

  /**
   * GC statistics
   */
  gcStats: {
    totalGCs: number
    totalGCTime: number
    averageGCTime: number
    memoryReclaimed: number
  }

  /**
   * Memory pressure events
   */
  pressureEvents: number

  /**
   * Allocation patterns
   */
  allocationPatterns: Array<{
    size: number
    count: number
    totalTime: number
    averageTime: number
  }>

  /**
   * Timeline of memory usage
   */
  timeline: Array<{
    timestamp: number
    memory: number
    operation: string
  }>

  /**
   * Custom metrics
   */
  customMetrics: Record<string, any>

  /**
   * Test success status
   */
  success: boolean

  /**
   * Error message if test failed
   */
  error?: string

  /**
   * Test score (0-100)
   */
  score: number
}

/**
 * Memory performance test suite
 */
export interface MemoryPerformanceTestSuite {
  name: string
  description: string
  tests: MemoryPerformanceTest[]
  results: MemoryPerformanceMetrics[]
  startTime: Date
  endTime?: Date
  summary: TestSuiteSummary
}

/**
 * Test suite summary
 */
export interface TestSuiteSummary {
  totalTests: number
  passedTests: number
  failedTests: number
  totalDuration: number
  averageScore: number
  worstPerformingTest: string
  bestPerformingTest: string
  recommendations: string[]
}

/**
 * Memory performance test
 */
export interface MemoryPerformanceTest {
  name: string
  description: string
  config: MemoryPerformanceTestConfig
  execute: (context: TestExecutionContext) => Promise<void>
  validate: (metrics: MemoryPerformanceMetrics) => boolean
  cleanup?: () => Promise<void>
}

/**
 * Test execution context
 */
export interface TestExecutionContext {
  module: IWasmModule
  memoryManager: WasmMemoryManager
  config: MemoryPerformanceTestConfig
  metrics: MemoryPerformanceMetrics
  shouldStop: () => boolean
  recordMetric: (name: string, value: any) => void
}

/**
 * Memory performance tester
 */
export class MemoryPerformanceTester {
  private testSuites: Map<string, MemoryPerformanceTestSuite> = new Map()
  private runningTests: Map<string, Promise<MemoryPerformanceMetrics>> = new Map()

  /**
   * Create a new test suite
   */
  createTestSuite(name: string, description: string): MemoryPerformanceTestSuite {
    const suite: MemoryPerformanceTestSuite = {
      name,
      description,
      tests: [],
      results: [],
      startTime: new Date(),
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        totalDuration: 0,
        averageScore: 0,
        worstPerformingTest: '',
        bestPerformingTest: '',
        recommendations: []
      }
    }

    this.testSuites.set(name, suite)
    return suite
  }

  /**
   * Add a test to a suite
   */
  addTest(suiteName: string, test: MemoryPerformanceTest): void {
    const suite = this.testSuites.get(suiteName)
    if (!suite) {
      throw new Error(`Test suite '${suiteName}' not found`)
    }

    suite.tests.push(test)
    suite.summary.totalTests++
  }

  /**
   * Run a single test
   */
  async runTest(
    module: IWasmModule,
    test: MemoryPerformanceTest,
    memoryManager: WasmMemoryManager
  ): Promise<MemoryPerformanceMetrics> {
    const testId = `${module.id}-${test.name}`

    if (this.runningTests.has(testId)) {
      throw new Error(`Test '${test.name}' is already running for module ${module.id}`)
    }

    const testPromise = this.executeTest(module, test, memoryManager)
    this.runningTests.set(testId, testPromise)

    try {
      const result = await testPromise
      return result
    } finally {
      this.runningTests.delete(testId)
    }
  }

  /**
   * Run all tests in a suite
   */
  async runTestSuite(
    module: IWasmModule,
    suiteName: string,
    memoryManager: WasmMemoryManager
  ): Promise<MemoryPerformanceTestSuite> {
    const suite = this.testSuites.get(suiteName)
    if (!suite) {
      throw new Error(`Test suite '${suiteName}' not found`)
    }

    suite.results = []
    suite.startTime = new Date()

    for (const test of suite.tests) {
      try {
        const metrics = await this.runTest(module, test, memoryManager)
        suite.results.push(metrics)

        if (metrics.success) {
          suite.summary.passedTests++
        } else {
          suite.summary.failedTests++
        }
      } catch (error) {
        const errorMetrics: MemoryPerformanceMetrics = {
          testName: test.name,
          moduleId: module.id,
          duration: 0,
          operations: 0,
          operationsPerSecond: 0,
          peakMemoryUsage: 0,
          averageMemoryUsage: 0,
          totalMemoryAllocated: 0,
          totalMemoryDeallocated: 0,
          memoryLeaked: 0,
          memoryEfficiency: 0,
          gcStats: {
            totalGCs: 0,
            totalGCTime: 0,
            averageGCTime: 0,
            memoryReclaimed: 0
          },
          pressureEvents: 0,
          allocationPatterns: [],
          timeline: [],
          customMetrics: {},
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          score: 0
        }
        suite.results.push(errorMetrics)
        suite.summary.failedTests++
      }
    }

    suite.endTime = new Date()
    this.calculateSuiteSummary(suite)

    return suite
  }

  /**
   * Execute a single test
   */
  private async executeTest(
    module: IWasmModule,
    test: MemoryPerformanceTest,
    memoryManager: WasmMemoryManager
  ): Promise<MemoryPerformanceMetrics> {
    const startTime = Date.now()
    let shouldStop = false

    const metrics: MemoryPerformanceMetrics = {
      testName: test.name,
      moduleId: module.id,
      duration: 0,
      operations: 0,
      operationsPerSecond: 0,
      peakMemoryUsage: 0,
      averageMemoryUsage: 0,
      totalMemoryAllocated: 0,
      totalMemoryDeallocated: 0,
      memoryLeaked: 0,
      memoryEfficiency: 0,
      gcStats: {
        totalGCs: 0,
        totalGCTime: 0,
        averageGCTime: 0,
        memoryReclaimed: 0
      },
      pressureEvents: 0,
      allocationPatterns: [],
      timeline: [],
      customMetrics: {},
      success: false,
      score: 0
    }

    const context: TestExecutionContext = {
      module,
      memoryManager,
      config: test.config,
      metrics,
      shouldStop: () => shouldStop,
      recordMetric: (name: string, value: any) => {
        metrics.customMetrics[name] = value
      }
    }

    try {
      // Warmup phase
      if (test.config.warmupIterations > 0) {
        await this.performWarmup(context, test.config.warmupIterations)
      }

      // Main test execution
      const testPromise = test.execute(context)

      // Setup timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          shouldStop = true
          reject(new Error(`Test timeout after ${test.config.timeout}ms`))
        }, test.config.timeout)
      })

      // Run test with timeout
      await Promise.race([testPromise, timeoutPromise])

      // Calculate final metrics
      metrics.duration = Date.now() - startTime
      metrics.operationsPerSecond = metrics.duration > 0 ?
        (metrics.operations / metrics.duration) * 1000 : 0

      // Validate test results
      metrics.success = test.validate(metrics)
      metrics.score = this.calculateTestScore(metrics)

      return metrics
    } catch (error) {
      metrics.duration = Date.now() - startTime
      metrics.success = false
      metrics.error = error instanceof Error ? error.message : 'Unknown error'
      metrics.score = 0

      return metrics
    } finally {
      // Cleanup
      if (test.cleanup) {
        try {
          await test.cleanup()
        } catch (error) {
          console.warn('Test cleanup failed:', error)
        }
      }
    }
  }

  /**
   * Perform warmup iterations
   */
  private async performWarmup(context: TestExecutionContext, iterations: number): Promise<void> {
    for (let i = 0; i < iterations; i++) {
      if (context.shouldStop()) break

      // Perform minimal operations for warmup
      const size = 1024 // 1KB
      if (context.memoryManager.canAllocate(context.module.id, size)) {
        context.memoryManager.recordAllocation(context.module.id, size)
        context.metrics.operations++

        // Immediate deallocation for warmup
        context.memoryManager.recordDeallocation(context.module.id, size)
      }
    }
  }

  /**
   * Calculate test score (0-100)
   */
  private calculateTestScore(metrics: MemoryPerformanceMetrics): number {
    let score = 0

    // Success weight: 40%
    if (metrics.success) {
      score += 40
    }

    // Memory efficiency weight: 30%
    score += Math.min(30, metrics.memoryEfficiency * 0.3)

    // Performance weight: 20%
    if (metrics.operationsPerSecond > 1000) {
      score += 20
    } else if (metrics.operationsPerSecond > 100) {
      score += 15
    } else if (metrics.operationsPerSecond > 10) {
      score += 10
    } else if (metrics.operationsPerSecond > 1) {
      score += 5
    }

    // Leak prevention weight: 10%
    if (metrics.memoryLeaked === 0) {
      score += 10
    } else if (metrics.memoryLeaked < 1024) { // Less than 1KB
      score += 5
    }

    return Math.min(100, score)
  }

  /**
   * Calculate suite summary
   */
  private calculateSuiteSummary(suite: MemoryPerformanceTestSuite): void {
    const results = suite.results
    if (results.length === 0) return

    let totalDuration = 0
    let totalScore = 0
    let worstScore = 100
    let bestScore = 0
    let worstTestName = ''
    let bestTestName = ''

    for (const result of results) {
      totalDuration += result.duration
      totalScore += result.score

      if (result.score < worstScore) {
        worstScore = result.score
        worstTestName = result.testName
      }

      if (result.score > bestScore) {
        bestScore = result.score
        bestTestName = result.testName
      }
    }

    suite.summary.totalDuration = totalDuration
    suite.summary.averageScore = totalScore / results.length
    suite.summary.worstPerformingTest = worstTestName
    suite.summary.bestPerformingTest = bestTestName

    // Generate recommendations
    suite.summary.recommendations = this.generateRecommendations(results)
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(results: MemoryPerformanceMetrics[]): string[] {
    const recommendations: string[] = []

    // Analyze common issues
    const leakyTests = results.filter(r => r.memoryLeaked > 0)
    const slowTests = results.filter(r => r.operationsPerSecond < 100)
    const inefficientTests = results.filter(r => r.memoryEfficiency < 70)
    const failedTests = results.filter(r => !r.success)

    if (leakyTests.length > 0) {
      recommendations.push('Implement better memory cleanup to prevent leaks')
    }

    if (slowTests.length > 0) {
      recommendations.push('Optimize algorithms for better performance')
    }

    if (inefficientTests.length > 0) {
      recommendations.push('Use memory-efficient data structures')
    }

    if (failedTests.length > 0) {
      recommendations.push('Fix failing tests before optimizing')
    }

    if (recommendations.length === 0) {
      recommendations.push('Memory performance is optimal')
    }

    return recommendations
  }

  /**
   * Get test results
   */
  getTestResults(suiteName?: string): MemoryPerformanceTestSuite[] {
    if (suiteName) {
      const suite = this.testSuites.get(suiteName)
      return suite ? [suite] : []
    }

    return Array.from(this.testSuites.values())
  }

  /**
   * Cancel a running test
   */
  cancelTest(moduleId: string, testName: string): boolean {
    const testId = `${moduleId}-${testName}`
    const testPromise = this.runningTests.get(testId)

    if (testPromise) {
      // In a real implementation, we'd need a way to cancel the test
      this.runningTests.delete(testId)
      return true
    }

    return false
  }

  /**
   * Clear all test suites
   */
  clearTestSuites(): void {
    this.testSuites.clear()
  }

  /**
   * Export test results
   */
  exportResults(): {
    exportedAt: string
    suites: MemoryPerformanceTestSuite[]
  } {
    return {
      exportedAt: new Date().toISOString(),
      suites: Array.from(this.testSuites.values())
    }
  }
}

/**
 * Built-in memory performance tests
 */
export class BuiltInMemoryTests {
  /**
   * Basic allocation test
   */
  static createBasicAllocationTest(): MemoryPerformanceTest {
    return {
      name: 'Basic Allocation Test',
      description: 'Tests basic memory allocation and deallocation patterns',
      config: {
        testDuration: 10000,
        iterations: 1000,
        warmupIterations: 10,
        loadPattern: 'constant',
        maxMemoryLoad: 10 * 1024 * 1024, // 10MB
        allocationSizes: [1024, 4096, 8192], // 1KB, 4KB, 8KB
        allocationIntervals: [10, 50, 100], // 10ms, 50ms, 100ms
        deallocationProbability: 0.8,
        enableConcurrency: false,
        concurrency: 1,
        enableStressTest: false,
        stressMultiplier: 1,
        enableLeakSimulation: false,
        leakProbability: 0,
        scenarios: [],
        timeout: 30000,
        enableDetailedMetrics: true,
        metricsInterval: 100
      },
      execute: async (context) => {
        const { config, metrics, memoryManager, module } = context
        const startTime = Date.now()

        while (Date.now() - startTime < config.testDuration && !context.shouldStop()) {
          // Allocate memory
          const size = config.allocationSizes[
            Math.floor(Math.random() * config.allocationSizes.length)
          ]

          if (memoryManager.canAllocate(module.id, size)) {
            memoryManager.recordAllocation(module.id, size)
            metrics.totalMemoryAllocated += size
            metrics.operations++

            // Random deallocation
            if (Math.random() < config.deallocationProbability) {
              const deallocSize = Math.min(size, metrics.totalMemoryAllocated)
              memoryManager.recordDeallocation(module.id, deallocSize)
              metrics.totalMemoryDeallocated += deallocSize
            }

            // Record memory usage
            const usage = memoryManager.getMemoryUsage(module.id)
            if (usage) {
              metrics.peakMemoryUsage = Math.max(metrics.peakMemoryUsage, usage.used)
              metrics.timeline.push({
                timestamp: Date.now() - startTime,
                memory: usage.used,
                operation: 'allocation'
              })
            }
          }

          // Wait based on allocation interval
          const interval = config.allocationIntervals[
            Math.floor(Math.random() * config.allocationIntervals.length)
          ]
          await new Promise(resolve => setTimeout(resolve, interval))
        }

        metrics.memoryLeaked = metrics.totalMemoryAllocated - metrics.totalMemoryDeallocated
        metrics.averageMemoryUsage = metrics.timeline.length > 0 ?
          metrics.timeline.reduce((sum, t) => sum + t.memory, 0) / metrics.timeline.length : 0
      },
      validate: (metrics) => {
        return metrics.success &&
               metrics.memoryLeaked < metrics.totalMemoryAllocated * 0.1 && // Less than 10% leaked
               metrics.memoryEfficiency > 70 // At least 70% efficient
      }
    }
  }

  /**
   * Stress test
   */
  static createStressTest(): MemoryPerformanceTest {
    return {
      name: 'Memory Stress Test',
      description: 'Tests memory handling under extreme load',
      config: {
        testDuration: 30000,
        iterations: 10000,
        warmupIterations: 50,
        loadPattern: 'burst',
        maxMemoryLoad: 50 * 1024 * 1024, // 50MB
        allocationSizes: [1024, 10240, 102400, 1048576], // 1KB to 1MB
        allocationIntervals: [1, 5, 10], // Very fast allocation
        deallocationProbability: 0.3, // Less deallocation
        enableConcurrency: true,
        concurrency: 5,
        enableStressTest: true,
        stressMultiplier: 3,
        enableLeakSimulation: true,
        leakProbability: 0.1,
        scenarios: [],
        timeout: 60000,
        enableDetailedMetrics: true,
        metricsInterval: 50
      },
      execute: async (context) => {
        const { config, metrics, memoryManager, module } = context
        const startTime = Date.now()
        const concurrentOperations: Promise<void>[] = []

        const runOperation = async (workerId: number) => {
          while (Date.now() - startTime < config.testDuration && !context.shouldStop()) {
            // Burst pattern: allocate many small chunks quickly
            const burstSize = 10 + Math.floor(Math.random() * 20)

            for (let i = 0; i < burstSize; i++) {
              const size = config.allocationSizes[
                Math.floor(Math.random() * config.allocationSizes.length)
              ] * config.stressMultiplier

              if (memoryManager.canAllocate(module.id, size)) {
                memoryManager.recordAllocation(module.id, size)
                metrics.totalMemoryAllocated += size
                metrics.operations++

                // Simulate leak with probability
                if (Math.random() < config.leakProbability) {
                  // Don't deallocate (simulate leak)
                  continue
                }

                // Random deallocation
                if (Math.random() < config.deallocationProbability) {
                  const deallocSize = Math.min(size, metrics.totalMemoryAllocated)
                  memoryManager.recordDeallocation(module.id, deallocSize)
                  metrics.totalMemoryDeallocated += deallocSize
                }
              }

              if (context.shouldStop()) break
            }

            // Wait between bursts
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
          }
        }

        // Start concurrent operations
        for (let i = 0; i < config.concurrency; i++) {
          concurrentOperations.push(runOperation(i))
        }

        // Wait for all operations to complete
        await Promise.all(concurrentOperations)

        metrics.memoryLeaked = metrics.totalMemoryAllocated - metrics.totalMemoryDeallocated
      },
      validate: (metrics) => {
        return metrics.success &&
               metrics.peakMemoryUsage < 100 * 1024 * 1024 && // Less than 100MB peak
               metrics.operations > 1000 // At least 1000 operations
      }
    }
  }

  /**
   * Leak detection test
   */
  static createLeakDetectionTest(): MemoryPerformanceTest {
    return {
      name: 'Memory Leak Detection Test',
      description: 'Tests for memory leaks under various conditions',
      config: {
        testDuration: 20000,
        iterations: 5000,
        warmupIterations: 20,
        loadPattern: 'realistic',
        maxMemoryLoad: 20 * 1024 * 1024, // 20MB
        allocationSizes: [512, 2048, 8192, 32768], // 512B to 32KB
        allocationIntervals: [50, 100, 200],
        deallocationProbability: 0.9,
        enableConcurrency: false,
        concurrency: 1,
        enableStressTest: false,
        stressMultiplier: 1,
        enableLeakSimulation: true,
        leakProbability: 0.05,
        scenarios: [],
        timeout: 45000,
        enableDetailedMetrics: true,
        metricsInterval: 200
      },
      execute: async (context) => {
        const { config, metrics, memoryManager, module } = context
        const startTime = Date.now()
        const allocations: Array<{ size: number; timestamp: number }> = []

        while (Date.now() - startTime < config.testDuration && !context.shouldStop()) {
          // Realistic allocation pattern
          const size = config.allocationSizes[
            Math.floor(Math.random() * config.allocationSizes.length)
          ]

          if (memoryManager.canAllocate(module.id, size)) {
            memoryManager.recordAllocation(module.id, size)
            metrics.totalMemoryAllocated += size
            metrics.operations++

            const allocation = {
              size,
              timestamp: Date.now()
            }
            allocations.push(allocation)

            // Deallocation based on age
            const now = Date.now()
            const toDeallocate = allocations.filter(a =>
              now - a.timestamp > 1000 + Math.random() * 4000 // 1-5 seconds lifetime
            )

            for (const alloc of toDeallocate) {
              if (Math.random() < config.deallocationProbability) {
                memoryManager.recordDeallocation(module.id, alloc.size)
                metrics.totalMemoryDeallocated += alloc.size

                const index = allocations.indexOf(alloc)
                if (index > -1) {
                  allocations.splice(index, 1)
                }
              }
            }

            // Record memory usage
            const usage = memoryManager.getMemoryUsage(module.id)
            if (usage) {
              metrics.peakMemoryUsage = Math.max(metrics.peakMemoryUsage, usage.used)
              metrics.timeline.push({
                timestamp: Date.now() - startTime,
                memory: usage.used,
                operation: 'realistic_allocation'
              })
            }
          }

          // Wait
          await new Promise(resolve => setTimeout(resolve,
            config.allocationIntervals[Math.floor(Math.random() * config.allocationIntervals.length)]
          ))
        }

        // Clean up remaining allocations
        for (const alloc of allocations) {
          memoryManager.recordDeallocation(module.id, alloc.size)
          metrics.totalMemoryDeallocated += alloc.size
        }

        metrics.memoryLeaked = metrics.totalMemoryAllocated - metrics.totalMemoryDeallocated
      },
      validate: (metrics) => {
        return metrics.success &&
               metrics.memoryLeaked < metrics.totalMemoryAllocated * 0.02 && // Less than 2% leaked
               metrics.peakMemoryUsage < config.maxMemoryLoad * 1.5 // Within 150% of limit
      }
    }
  }
}

// Export singleton instance
export const memoryPerformanceTester = new MemoryPerformanceTester()

// Export utility functions
export function createMemoryPerformanceTester(): MemoryPerformanceTester {
  return new MemoryPerformanceTester()
}

export function createTestSuite(name: string, description: string): MemoryPerformanceTestSuite {
  return memoryPerformanceTester.createTestSuite(name, description)
}

export function addTestToSuite(suiteName: string, test: MemoryPerformanceTest): void {
  memoryPerformanceTester.addTest(suiteName, test)
}

export async function runMemoryPerformanceTest(
  module: IWasmModule,
  test: MemoryPerformanceTest,
  memoryManager: WasmMemoryManager
): Promise<MemoryPerformanceMetrics> {
  return memoryPerformanceTester.runTest(module, test, memoryManager)
}

export async function runMemoryPerformanceTestSuite(
  module: IWasmModule,
  suiteName: string,
  memoryManager: WasmMemoryManager
): Promise<MemoryPerformanceTestSuite> {
  return memoryPerformanceTester.runTestSuite(module, suiteName, memoryManager)
}

export function getBuiltInTests(): {
  basicAllocation: MemoryPerformanceTest
  stress: MemoryPerformanceTest
  leakDetection: MemoryPerformanceTest
} {
  return {
    basicAllocation: BuiltInMemoryTests.createBasicAllocationTest(),
    stress: BuiltInMemoryTests.createStressTest(),
    leakDetection: BuiltInMemoryTests.createLeakDetectionTest()
  }
}
