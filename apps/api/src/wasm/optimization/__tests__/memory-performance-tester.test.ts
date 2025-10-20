import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  MemoryPerformanceTester,
  BuiltInMemoryTests,
  MemoryPerformanceTestConfig
} from '../memory-performance-tester'
import { WasmMemoryManager } from '../memory-manager'
import { IWasmModule } from '../../modules/interfaces/wasm-module.interface'

// Mock WASM module for testing
class MockWasmModule implements IWasmModule {
  constructor(public readonly id: string) {}

  get name(): string { return this.id }
  get version(): string { return '1.0.0' }
  get description(): string { return `Mock module ${this.id}` }
  get category(): string { return 'test' }
  get authors(): string[] { return ['Test Author'] }
  get dependencies(): string[] { return [] }
  get apiVersion(): string { return '1.0.0' }

  async isCompatible(): Promise<boolean> { return true }
  async initialize(): Promise<void> {}
  isInitialized(): boolean { return true }
  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      description: this.description,
      category: this.category,
      authors: this.authors,
      dependencies: this.dependencies,
      apiVersion: this.apiVersion,
      executionCount: 0,
      memoryUsage: 0,
      loadTime: 0,
      size: 0,
      checksum: '',
      supportedFormats: [],
      capabilities: [],
      limitations: []
    }
  }
  async execute(): Promise<any> { return { success: true } }
  async dispose(): Promise<void> {}
  async getHealth() {
    return {
      status: 'healthy' as const,
      lastCheck: new Date(),
      responseTime: 0,
      memoryUsage: 0,
      errorRate: 0,
      uptime: 0
    }
  }
}

describe('MemoryPerformanceTester', () => {
  let tester: MemoryPerformanceTester
  let memoryManager: WasmMemoryManager
  let mockModule: IWasmModule

  beforeEach(() => {
    tester = new MemoryPerformanceTester()

    // Create a memory manager with minimal configuration for testing
    memoryManager = new WasmMemoryManager({
      limits: {
        hardLimit: 50 * 1024 * 1024, // 50MB
        softLimit: 40 * 1024 * 1024, // 40MB
        criticalLimit: 45 * 1024 * 1024, // 45MB
        growthRateLimit: 10 * 1024 * 1024, // 10MB/s
        maxAllocationSize: 10 * 1024 * 1024, // 10MB
        quotaResetInterval: 60000,
        enableQuotas: false // Disable for simpler testing
      },
      gc: {
        autoGC: false,
        gcThreshold: 75,
        aggressiveGCThreshold: 90,
        minGCInterval: 5000,
        maxGCDuration: 100,
        incrementalGC: true,
        strategy: 'balanced',
        enableCompaction: true,
        compactionThreshold: 70
      },
      monitoringInterval: 100,
      enablePressureHandling: false,
      enableBudgetTracking: false
    })

    mockModule = new MockWasmModule('test-module')
    memoryManager.registerModule(mockModule)
  })

  afterEach(() => {
    tester.clearTestSuites()
    memoryManager.dispose()
  })

  describe('Test Suite Management', () => {
    it('should create a test suite', () => {
      const suite = tester.createTestSuite('test-suite', 'Test description')

      expect(suite.name).toBe('test-suite')
      expect(suite.description).toBe('Test description')
      expect(suite.tests).toHaveLength(0)
      expect(suite.results).toHaveLength(0)
      expect(suite.summary.totalTests).toBe(0)
    })

    it('should add tests to a suite', () => {
      const suite = tester.createTestSuite('test-suite', 'Test description')

      const test = BuiltInMemoryTests.createBasicAllocationTest()
      tester.addTestToSuite('test-suite', test)

      expect(suite.tests).toHaveLength(1)
      expect(suite.summary.totalTests).toBe(1)
    })

    it('should throw error when adding test to non-existent suite', () => {
      const test = BuiltInMemoryTests.createBasicAllocationTest()

      expect(() => {
        tester.addTestToSuite('non-existent', test)
      }).toThrow("Test suite 'non-existent' not found")
    })
  })

  describe('Individual Test Execution', () => {
    it('should run basic allocation test', async () => {
      const test = BuiltInMemoryTests.createBasicAllocationTest()

      const result = await tester.runTest(mockModule, test, memoryManager)

      expect(result.testName).toBe('Basic Allocation Test')
      expect(result.moduleId).toBe('test-module')
      expect(result.duration).toBeGreaterThan(0)
      expect(result.operations).toBeGreaterThan(0)
      expect(result.operationsPerSecond).toBeGreaterThan(0)
      expect(result.peakMemoryUsage).toBeGreaterThanOrEqual(0)
      expect(result.totalMemoryAllocated).toBeGreaterThan(0)
      expect(result.totalMemoryDeallocated).toBeGreaterThanOrEqual(0)
      expect(result.memoryLeaked).toBeGreaterThanOrEqual(0)
      expect(result.memoryEfficiency).toBeGreaterThanOrEqual(0)
      expect(result.memoryEfficiency).toBeLessThanOrEqual(100)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
      expect(result.success).toBeDefined()
    }, 15000) // 15 second timeout

    it('should handle test validation', async () => {
      const test = BuiltInMemoryTests.createBasicAllocationTest()

      const result = await tester.runTest(mockModule, test, memoryManager)

      // Test should pass validation
      expect(result.success).toBe(true)
      expect(result.score).toBeGreaterThan(0)
    }, 15000)

    it('should record custom metrics', async () => {
      const test = {
        name: 'Custom Metrics Test',
        description: 'Test custom metrics recording',
        config: {
          testDuration: 1000,
          iterations: 10,
          warmupIterations: 0,
          loadPattern: 'constant' as const,
          maxMemoryLoad: 1024 * 1024,
          allocationSizes: [1024],
          allocationIntervals: [100],
          deallocationProbability: 0.5,
          enableConcurrency: false,
          concurrency: 1,
          enableStressTest: false,
          stressMultiplier: 1,
          enableLeakSimulation: false,
          leakProbability: 0,
          scenarios: [],
          timeout: 5000,
          enableDetailedMetrics: true,
          metricsInterval: 100
        },
        execute: async (context) => {
          context.recordMetric('customValue', 42)
          context.recordMetric('customObject', { test: true })
          context.metrics.operations = 5
        },
        validate: () => true
      }

      const result = await tester.runTest(mockModule, test, memoryManager)

      expect(result.customMetrics.customValue).toBe(42)
      expect(result.customMetrics.customObject).toEqual({ test: true })
    })

    it('should handle test failures gracefully', async () => {
      const failingTest = {
        name: 'Failing Test',
        description: 'Test that always fails',
        config: {
          testDuration: 1000,
          iterations: 10,
          warmupIterations: 0,
          loadPattern: 'constant' as const,
          maxMemoryLoad: 1024 * 1024,
          allocationSizes: [1024],
          allocationIntervals: [100],
          deallocationProbability: 0.5,
          enableConcurrency: false,
          concurrency: 1,
          enableStressTest: false,
          stressMultiplier: 1,
          enableLeakSimulation: false,
          leakProbability: 0,
          scenarios: [],
          timeout: 2000,
          enableDetailedMetrics: true,
          metricsInterval: 100
        },
        execute: async () => {
          throw new Error('Test execution failed')
        },
        validate: () => false
      }

      const result = await tester.runTest(mockModule, failingTest, memoryManager)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Test execution failed')
      expect(result.score).toBe(0)
    })

    it('should handle test timeouts', async () => {
      const slowTest = {
        name: 'Slow Test',
        description: 'Test that takes too long',
        config: {
          testDuration: 10000,
          iterations: 1000,
          warmupIterations: 0,
          loadPattern: 'constant' as const,
          maxMemoryLoad: 1024 * 1024,
          allocationSizes: [1024],
          allocationIntervals: [10],
          deallocationProbability: 0.5,
          enableConcurrency: false,
          concurrency: 1,
          enableStressTest: false,
          stressMultiplier: 1,
          enableLeakSimulation: false,
          leakProbability: 0,
          scenarios: [],
          timeout: 100, // Very short timeout
          enableDetailedMetrics: true,
          metricsInterval: 100
        },
        execute: async (context) => {
          // Simulate slow operation
          await new Promise(resolve => setTimeout(resolve, 1000))
          context.metrics.operations = 1
        },
        validate: () => true
      }

      const result = await tester.runTest(mockModule, slowTest, memoryManager)

      expect(result.success).toBe(false)
      expect(result.error).toContain('timeout')
    })
  })

  describe('Test Suite Execution', () => {
    it('should run all tests in a suite', async () => {
      const suite = tester.createTestSuite('test-suite', 'Test description')

      const test1 = BuiltInMemoryTests.createBasicAllocationTest()
      const test2 = BuiltInMemoryTests.createLeakDetectionTest()

      tester.addTestToSuite('test-suite', test1)
      tester.addTestToSuite('test-suite', test2)

      const results = await tester.runTestSuite(mockModule, 'test-suite', memoryManager)

      expect(results.results).toHaveLength(2)
      expect(results.summary.totalTests).toBe(2)
      expect(results.summary.totalDuration).toBeGreaterThan(0)
      expect(results.summary.averageScore).toBeGreaterThanOrEqual(0)
      expect(results.summary.averageScore).toBeLessThanOrEqual(100)
      expect(results.recommendations).toBeInstanceOf(Array)
    }, 30000)

    it('should calculate suite summary correctly', async () => {
      const suite = tester.createTestSuite('test-suite', 'Test description')

      const test1 = BuiltInMemoryTests.createBasicAllocationTest()
      const test2 = BuiltInMemoryTests.createLeakDetectionTest()

      tester.addTestToSuite('test-suite', test1)
      tester.addTestToSuite('test-suite', test2)

      const results = await tester.runTestSuite(mockModule, 'test-suite', memoryManager)

      expect(results.summary.passedTests + results.summary.failedTests).toBe(2)
      expect(results.summary.worstPerformingTest).toBeTruthy()
      expect(results.summary.bestPerformingTest).toBeTruthy()
    }, 30000)
  })

  describe('Built-in Tests', () => {
    it('should provide built-in tests', () => {
      const builtInTests = BuiltInMemoryTests

      expect(builtInTests.createBasicAllocationTest).toBeDefined()
      expect(builtInTests.createStressTest).toBeDefined()
      expect(builtInTests.createLeakDetectionTest).toBeDefined()
    })

    it('should create stress test', () => {
      const stressTest = BuiltInMemoryTests.createStressTest()

      expect(stressTest.name).toBe('Memory Stress Test')
      expect(stressTest.config.enableStressTest).toBe(true)
      expect(stressTest.config.enableConcurrency).toBe(true)
      expect(stressTest.config.stressMultiplier).toBeGreaterThan(1)
    })

    it('should create leak detection test', () => {
      const leakTest = BuiltInMemoryTests.createLeakDetectionTest()

      expect(leakTest.name).toBe('Memory Leak Detection Test')
      expect(leakTest.config.enableLeakSimulation).toBe(true)
      expect(leakTest.config.leakProbability).toBeGreaterThan(0)
    })
  })

  describe('Test Management', () => {
    it('should get test results', () => {
      const suite = tester.createTestSuite('test-suite', 'Test description')

      const results = tester.getTestResults('test-suite')
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('test-suite')
    })

    it('should get all test results', () => {
      const suite1 = tester.createTestSuite('suite1', 'Test 1')
      const suite2 = tester.createTestSuite('suite2', 'Test 2')

      const results = tester.getTestResults()
      expect(results).toHaveLength(2)
    })

    it('should export results', () => {
      const suite = tester.createTestSuite('test-suite', 'Test description')

      const exported = tester.exportResults()

      expect(exported).toHaveProperty('exportedAt')
      expect(exported).toHaveProperty('suites')
      expect(exported.suites).toHaveLength(1)
    })

    it('should clear test suites', () => {
      tester.createTestSuite('suite1', 'Test 1')
      tester.createTestSuite('suite2', 'Test 2')

      tester.clearTestSuites()

      const results = tester.getTestResults()
      expect(results).toHaveLength(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle non-existent test suite', async () => {
      await expect(
        tester.runTestSuite(mockModule, 'non-existent', memoryManager)
      ).rejects.toThrow("Test suite 'non-existent' not found")
    })

    it('should handle empty test suite', async () => {
      tester.createTestSuite('empty-suite', 'Empty suite')

      const results = await tester.runTestSuite(mockModule, 'empty-suite', memoryManager)

      expect(results.results).toHaveLength(0)
      expect(results.summary.totalTests).toBe(0)
      expect(results.summary.passedTests).toBe(0)
      expect(results.summary.failedTests).toBe(0)
    })
  })
})
