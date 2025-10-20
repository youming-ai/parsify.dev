import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { WasmMemoryManager, MemoryManagerConfig } from '../memory-manager'
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

describe('WasmMemoryManager', () => {
  let manager: WasmMemoryManager
  let mockModule: IWasmModule

  beforeEach(() => {
    manager = new WasmMemoryManager({
      limits: {
        hardLimit: 10 * 1024 * 1024, // 10MB
        softLimit: 8 * 1024 * 1024, // 8MB
        criticalLimit: 9 * 1024 * 1024, // 9MB
        growthRateLimit: 1024 * 1024, // 1MB/s
        maxAllocationSize: 1024 * 1024, // 1MB
        quotaResetInterval: 60000,
        enableQuotas: true
      },
      gc: {
        autoGC: false, // Disable for testing
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
      enablePressureHandling: false, // Disable for testing
      enableBudgetTracking: true,
      memoryBudget: 20 * 1024 * 1024, // 20MB
      budgetWindow: 60000
    })
    mockModule = new MockWasmModule('test-module')
  })

  afterEach(() => {
    manager.dispose()
  })

  describe('Module Registration', () => {
    it('should register a module', () => {
      manager.registerModule(mockModule)

      const usage = manager.getMemoryUsage('test-module')
      expect(usage).toBeTruthy()
      expect(usage?.allocated).toBeGreaterThanOrEqual(0)
    })

    it('should unregister a module', () => {
      manager.registerModule(mockModule)
      manager.unregisterModule('test-module')

      const usage = manager.getMemoryUsage('test-module')
      expect(usage).toBeNull()
    })

    it('should allow custom memory limits', () => {
      const customLimits = {
        hardLimit: 5 * 1024 * 1024, // 5MB
        softLimit: 4 * 1024 * 1024, // 4MB
        criticalLimit: 4.5 * 1024 * 1024 // 4.5MB
      }

      manager.registerModule(mockModule, customLimits)

      const usage = manager.getMemoryUsage('test-module')
      expect(usage).toBeTruthy()
    })
  })

  describe('Memory Allocation', () => {
    beforeEach(() => {
      manager.registerModule(mockModule)
    })

    it('should allow valid allocations', () => {
      const canAllocate = manager.canAllocate('test-module', 1024)
      expect(canAllocate).toBe(true)
    })

    it('should record successful allocations', () => {
      const allocated = manager.recordAllocation('test-module', 1024)
      expect(allocated).toBe(true)

      const usage = manager.getMemoryUsage('test-module')
      expect(usage?.used).toBe(1024)
    })

    it('should record deallocations', () => {
      manager.recordAllocation('test-module', 1024)
      manager.recordDeallocation('test-module', 512)

      const usage = manager.getMemoryUsage('test-module')
      expect(usage?.used).toBe(512)
    })

    it('should reject allocations exceeding hard limit', () => {
      const canAllocate = manager.canAllocate('test-module', 20 * 1024 * 1024) // 20MB
      expect(canAllocate).toBe(false)
    })

    it('should reject allocations exceeding max allocation size', () => {
      const canAllocate = manager.canAllocate('test-module', 2 * 1024 * 1024) // 2MB
      expect(canAllocate).toBe(false)
    })

    it('should handle non-existent module gracefully', () => {
      expect(manager.canAllocate('non-existent', 1024)).toBe(false)
      expect(manager.recordAllocation('non-existent', 1024)).toBe(false)
    })
  })

  describe('Memory Quotas', () => {
    beforeEach(() => {
      manager.registerModule(mockModule)
    })

    it('should track memory quotas', () => {
      manager.recordAllocation('test-module', 1024)

      const quota = manager.getMemoryQuota('test-module')
      expect(quota).toBeTruthy()
      expect(quota?.allocated).toBeGreaterThan(0)
      expect(quota?.used).toBe(1024)
      expect(quota?.remaining).toBeGreaterThan(0)
    })

    it('should prevent quota exceeded allocations', () => {
      // Use up most of the quota
      for (let i = 0; i < 15; i++) { // 15MB total (exceeds 20MB budget with overhead)
        manager.recordAllocation('test-module', 1024 * 1024) // 1MB each
      }

      // Should be rejected due to quota
      const canAllocate = manager.canAllocate('test-module', 1024 * 1024)
      expect(canAllocate).toBe(false)
    })
  })

  describe('Garbage Collection', () => {
    beforeEach(() => {
      manager.registerModule(mockModule)
    })

    it('should trigger garbage collection', async () => {
      manager.recordAllocation('test-module', 1024)

      const result = await manager.triggerGC('test-module')
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('memoryReclaimed')
      expect(result).toHaveProperty('duration')
      expect(result).toHaveProperty('type')
    })

    it('should handle GC for non-existent module', async () => {
      const result = await manager.triggerGC('non-existent')
      expect(result.success).toBe(false)
      expect(result.error).toContain('Module not found')
    })

    it('should trigger global GC', async () => {
      const module2 = new MockWasmModule('test-module-2')
      manager.registerModule(module2)

      const results = await manager.triggerGlobalGC()
      expect(results).toHaveLength(2)
      results.forEach(result => {
        expect(result).toHaveProperty('success')
      })
    })
  })

  describe('Aggregate Statistics', () => {
    it('should provide aggregated stats for multiple modules', () => {
      const module2 = new MockWasmModule('test-module-2')

      manager.registerModule(mockModule)
      manager.registerModule(module2)

      manager.recordAllocation('test-module', 1024)
      manager.recordAllocation('test-module-2', 2048)

      const stats = manager.getAggregateStats()
      expect(stats.totalModules).toBe(2)
      expect(stats.totalUsed).toBe(3072) // 1024 + 2048
      expect(stats.averageUsage).toBe(1536) // 3072 / 2
      expect(stats.gcStats).toBeTruthy()
    })

    it('should handle empty module list', () => {
      const stats = manager.getAggregateStats()
      expect(stats.totalModules).toBe(0)
      expect(stats.totalUsed).toBe(0)
      expect(stats.averageUsage).toBe(0)
    })
  })

  describe('Memory Pressure Handling', () => {
    it('should add and remove pressure handlers', () => {
      const handler = {
        level: 'high' as const,
        priority: 1,
        handler: () => {}
      }

      manager.addPressureHandler(handler)

      // Should not throw
      manager.removePressureHandler(handler)
    })
  })

  describe('Configuration Updates', () => {
    it('should update memory limits for existing modules', () => {
      manager.registerModule(mockModule)

      const newLimits = {
        hardLimit: 5 * 1024 * 1024, // 5MB
        softLimit: 4 * 1024 * 1024  // 4MB
      }

      manager.setMemoryLimits('test-module', newLimits)

      // Should still be able to allocate under new limit
      const canAllocate = manager.canAllocate('test-module', 1024)
      expect(canAllocate).toBe(true)

      // Should not be able to allocate over new limit
      const cannotAllocate = manager.canAllocate('test-module', 6 * 1024 * 1024)
      expect(cannotAllocate).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle operations on non-registered modules gracefully', () => {
      expect(manager.getMemoryUsage('non-existent')).toBeNull()
      expect(manager.getMemoryQuota('non-existent')).toBeNull()
      expect(manager.setMemoryLimits('non-existent', {})).not.toThrow()
    })

    it('should handle disposal safely', () => {
      manager.registerModule(mockModule)

      // Should not throw
      expect(() => manager.dispose()).not.toThrow()

      // Operations should be safe after disposal
      expect(() => manager.getMemoryUsage('test-module')).not.toThrow()
    })
  })
})
