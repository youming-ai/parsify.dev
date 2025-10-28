import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { IWasmModule } from '../../modules/interfaces/wasm-module.interface'
import { type MemoryMonitorConfig, WasmMemoryMonitor } from '../memory-monitor'

// Mock WASM module for testing
class MockWasmModule implements IWasmModule {
  constructor(public readonly id: string) {}

  get name(): string {
    return this.id
  }
  get version(): string {
    return '1.0.0'
  }
  get description(): string {
    return `Mock module ${this.id}`
  }
  get category(): string {
    return 'test'
  }
  get authors(): string[] {
    return ['Test Author']
  }
  get dependencies(): string[] {
    return []
  }
  get apiVersion(): string {
    return '1.0.0'
  }

  async isCompatible(): Promise<boolean> {
    return true
  }
  async initialize(): Promise<void> {}
  isInitialized(): boolean {
    return true
  }
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
      memoryUsage: 1024 * 1024, // 1MB
      loadTime: 0,
      size: 0,
      checksum: '',
      supportedFormats: [],
      capabilities: [],
      limitations: [],
    }
  }
  async execute(): Promise<any> {
    return { success: true }
  }
  async dispose(): Promise<void> {}
  async getHealth() {
    return {
      status: 'healthy' as const,
      lastCheck: new Date(),
      responseTime: 0,
      memoryUsage: 1024 * 1024,
      errorRate: 0,
      uptime: 0,
    }
  }
}

describe('WasmMemoryMonitor', () => {
  let monitor: WasmMemoryMonitor
  let mockModule: IWasmModule

  beforeEach(() => {
    monitor = new WasmMemoryMonitor({
      intervalMs: 100, // Fast for testing
      thresholds: {
        low: 50,
        medium: 70,
        high: 85,
        critical: 95,
      },
      maxHistorySize: 10,
      leakDetection: true,
      autoGC: false, // Disable for testing
      profiling: true,
      maxProfilingDuration: 1000,
    })
    mockModule = new MockWasmModule('test-module')
  })

  afterEach(() => {
    monitor.stopAll()
  })

  describe('Module Monitoring', () => {
    it('should start monitoring a module', () => {
      monitor.startMonitoring(mockModule, 10 * 1024 * 1024) // 10MB limit

      const activeMonitors = monitor.getActiveMonitors()
      expect(activeMonitors).toContain('test-module')
    })

    it('should stop monitoring a module', () => {
      monitor.startMonitoring(mockModule)
      monitor.stopMonitoring('test-module')

      const activeMonitors = monitor.getActiveMonitors()
      expect(activeMonitors).not.toContain('test-module')
    })

    it('should get memory stats for monitored module', async () => {
      monitor.startMonitoring(mockModule)

      // Wait for at least one monitoring cycle
      await new Promise(resolve => setTimeout(resolve, 150))

      const stats = monitor.getMemoryStats('test-module')
      expect(stats).toBeTruthy()
      expect(stats?.allocated).toBeGreaterThan(0)
      expect(stats?.used).toBeGreaterThanOrEqual(0)
      expect(stats?.available).toBeGreaterThanOrEqual(0)
    })

    it('should return null for non-monitored module', () => {
      const stats = monitor.getMemoryStats('non-existent')
      expect(stats).toBeNull()
    })
  })

  describe('Memory Warnings', () => {
    it('should generate warnings when memory usage exceeds thresholds', async () => {
      const warnings: any[] = []
      monitor.onWarning(warning => warnings.push(warning))

      // Start with low limit to trigger warnings
      monitor.startMonitoring(mockModule, 1024 * 1024) // 1MB limit

      // Wait for monitoring cycle
      await new Promise(resolve => setTimeout(resolve, 150))

      // Should have generated at least one warning
      expect(warnings.length).toBeGreaterThan(0)
      expect(warnings[0]).toHaveProperty('level')
      expect(warnings[0]).toHaveProperty('message')
      expect(warnings[0]).toHaveProperty('moduleId', 'test-module')
    })

    it('should provide suggestions in warnings', async () => {
      let warning: any = null
      monitor.onWarning(w => (warning = w))

      monitor.startMonitoring(mockModule, 1024 * 1024)
      await new Promise(resolve => setTimeout(resolve, 150))

      expect(warning).toBeTruthy()
      expect(warning.suggestions).toBeInstanceOf(Array)
      expect(warning.suggestions.length).toBeGreaterThan(0)
    })
  })

  describe('Memory Profiling', () => {
    it('should generate memory profiles', async () => {
      let profile: any = null
      monitor.onProfile(p => (profile = p))

      monitor.startMonitoring(mockModule)

      // Wait for profiling
      await new Promise(resolve => setTimeout(resolve, 200))

      expect(profile).toBeTruthy()
      expect(profile).toHaveProperty('moduleId', 'test-module')
      expect(profile).toHaveProperty('currentStats')
      expect(profile).toHaveProperty('timeline')
      expect(profile).toHaveProperty('efficiencyScore')
    })

    it('should track memory timeline', async () => {
      let profile: any = null
      monitor.onProfile(p => (profile = p))

      monitor.startMonitoring(mockModule)
      await new Promise(resolve => setTimeout(resolve, 300))

      expect(profile?.timeline).toBeInstanceOf(Array)
      expect(profile?.timeline.length).toBeGreaterThan(0)

      const timelineEntry = profile?.timeline[0]
      expect(timelineEntry).toHaveProperty('timestamp')
      expect(timelineEntry).toHaveProperty('memory')
      expect(timelineEntry).toHaveProperty('operation')
    })
  })

  describe('Aggregated Statistics', () => {
    it('should provide aggregated stats for all modules', async () => {
      const module2 = new MockWasmModule('test-module-2')

      monitor.startMonitoring(mockModule)
      monitor.startMonitoring(module2)

      await new Promise(resolve => setTimeout(resolve, 150))

      const stats = monitor.getAggregatedStats()
      expect(stats.totalModules).toBe(2)
      expect(stats.totalMemoryUsage).toBeGreaterThan(0)
      expect(stats.averageEfficiency).toBeGreaterThanOrEqual(0)
      expect(stats.averageEfficiency).toBeLessThanOrEqual(100)
    })
  })

  describe('Configuration', () => {
    it('should update configuration', () => {
      const newConfig: Partial<MemoryMonitorConfig> = {
        intervalMs: 500,
        thresholds: {
          low: 40,
          medium: 60,
          high: 80,
          critical: 90,
        },
      }

      monitor.updateConfig(newConfig)
      const config = monitor.getConfig()

      expect(config.intervalMs).toBe(500)
      expect(config.thresholds.low).toBe(40)
    })
  })

  describe('Garbage Collection', () => {
    it('should force garbage collection', () => {
      monitor.startMonitoring(mockModule)

      // Should not throw
      expect(() => monitor.forceGarbageCollection()).not.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing module gracefully', () => {
      expect(() => monitor.stopMonitoring('non-existent')).not.toThrow()
      expect(() => monitor.setMemoryLimit('non-existent', 1024)).not.toThrow()
    })

    it('should handle callback errors', async () => {
      monitor.onWarning(() => {
        throw new Error('Callback error')
      })

      // Should not throw despite callback error
      expect(() => {
        monitor.startMonitoring(mockModule, 1024)
      }).not.toThrow()
    })
  })
})
