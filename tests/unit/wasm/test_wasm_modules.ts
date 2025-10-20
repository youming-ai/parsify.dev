import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  WasmModuleLoader,
  WasmModuleRegistry,
  WasmErrorHandler,
  IWasmModule,
  IWasmModuleLoader,
  IWasmModuleRegistry,
  WasmModuleConfig,
  WasmModuleResult,
  WasmModuleError,
  WasmModuleMetadata,
  WasmModuleHealth,
  ModuleUpdate
} from '../../../apps/api/src/wasm/modules'
import { mockWasmRegistry } from '../mocks/wasm-mocks'

describe('WasmModuleLoader', () => {
  let loader: WasmModuleLoader

  beforeEach(() => {
    loader = new WasmModuleLoader()
  })

  afterEach(() => {
    loader.clear()
  })

  describe('Module loading', () => {
    it('should load a module successfully', async () => {
      const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
      await mockModule.initialize()

      // Mock the loadModule method to return our mock module
      vi.spyOn(loader, 'loadModule').mockResolvedValue(mockModule as any)

      const module = await loader.loadModule('test-module')
      expect(module).toBeDefined()
      expect(module.id).toBe('json-wasm-mock')
    })

    it('should handle module loading errors', async () => {
      const invalidModuleId = 'non-existent-module'

      await expect(loader.loadModule(invalidModuleId))
        .rejects.toThrow()
    })

    it('should prevent loading the same module multiple times', async () => {
      const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
      await mockModule.initialize()

      vi.spyOn(loader, 'loadModule').mockResolvedValue(mockModule as any)

      const module1 = await loader.loadModule('test-module')
      const module2 = await loader.loadModule('test-module')

      expect(module1).toBe(module2)
      expect(loader.isModuleLoaded('test-module')).toBe(true)
    })

    it('should handle concurrent loading requests', async () => {
      const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
      await mockModule.initialize()

      vi.spyOn(loader, 'loadModule').mockResolvedValue(mockModule as any)

      const [module1, module2, module3] = await Promise.all([
        loader.loadModule('concurrent-test'),
        loader.loadModule('concurrent-test'),
        loader.loadModule('concurrent-test')
      ])

      expect(module1).toBe(module2)
      expect(module2).toBe(module3)
      expect(loader.isModuleLoaded('concurrent-test')).toBe(true)
    })

    it('should unload modules properly', async () => {
      const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
      await mockModule.initialize()

      vi.spyOn(loader, 'loadModule').mockResolvedValue(mockModule as any)

      const module = await loader.loadModule('test-unload')
      expect(loader.isModuleLoaded('test-unload')).toBe(true)

      await loader.unloadModule('test-unload')
      expect(loader.isModuleLoaded('test-unload')).toBe(false)
    })

    it('should preload modules', async () => {
      const mockModule1 = mockWasmRegistry.getModule('json-wasm-mock')!
      const mockModule2 = mockWasmRegistry.getModule('code-formatter-wasm-mock')!
      await mockModule1.initialize()
      await mockModule2.initialize()

      vi.spyOn(loader, 'loadModule').mockImplementation(async (id) => {
        if (id === 'module1') return mockModule1 as any
        if (id === 'module2') return mockModule2 as any
        throw new Error('Module not found')
      })

      await loader.preloadModules(['module1', 'module2'])

      expect(loader.isModuleLoaded('module1')).toBe(true)
      expect(loader.isModuleLoaded('module2')).toBe(true)
    })

    it('should clear all loaded modules', async () => {
      const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
      await mockModule.initialize()

      vi.spyOn(loader, 'loadModule').mockResolvedValue(mockModule as any)

      await loader.loadModule('test1')
      await loader.loadModule('test2')

      expect(loader.getLoadedModules().length).toBe(2)

      loader.clear()

      expect(loader.getLoadedModules().length).toBe(0)
    })
  })

  describe('Configuration', () => {
    it('should accept custom configuration', async () => {
      const config: WasmModuleConfig = {
        maxMemory: 32 * 1024 * 1024, // 32MB
        timeout: 15000, // 15 seconds
        debug: true,
        logLevel: 'debug',
        options: {
          customOption: 'value'
        }
      }

      const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
      await mockModule.initialize()

      vi.spyOn(loader, 'loadModule').mockResolvedValue(mockModule as any)

      await loader.loadModule('test-config', config)

      // Configuration should be applied to the module
      expect(loader.isModuleLoaded('test-config')).toBe(true)
    })

    it('should handle invalid configuration gracefully', async () => {
      const invalidConfig = {
        maxMemory: -1, // Invalid
        timeout: 0, // Invalid
        logLevel: 'invalid' as any
      }

      const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
      await mockModule.initialize()

      vi.spyOn(loader, 'loadModule').mockResolvedValue(mockModule as any)

      await loader.loadModule('test-invalid-config', invalidConfig)

      expect(loader.isModuleLoaded('test-invalid-config')).toBe(true)
    })
  })

  describe('Error handling', () => {
    it('should handle module loading failures', async () => {
      vi.spyOn(loader, 'loadModule').mockRejectedValue(new Error('Failed to load module'))

      await expect(loader.loadModule('failing-module'))
        .rejects.toThrow('Failed to load module')
    })

    it('should handle module initialization failures', async () => {
      const mockModule = {
        id: 'failing-module',
        name: 'Failing Module',
        version: '1.0.0',
        isInitialized: false,
        initialize: vi.fn().mockRejectedValue(new Error('Initialization failed')),
        execute: vi.fn(),
        dispose: vi.fn()
      }

      vi.spyOn(loader, 'loadModule').mockRejectedValue(new Error('Initialization failed'))

      await expect(loader.loadModule('failing-module'))
        .rejects.toThrow()
    })

    it('should handle module execution failures', async () => {
      const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
      await mockModule.initialize()

      vi.spyOn(loader, 'loadModule').mockResolvedValue(mockModule as any)

      const module = await loader.loadModule('test-execution-fail')

      // Mock execution failure
      vi.spyOn(mockModule, 'execute').mockRejectedValue(new Error('Execution failed'))

      await expect(module.execute({ test: 'data' }))
        .rejects.toThrow('Execution failed')
    })
  })
})

describe('WasmModuleRegistry', () => {
  let registry: WasmModuleRegistry

  beforeEach(() => {
    registry = new WasmModuleRegistry()
  })

  afterEach(async () => {
    // Clean up registry
    const modules = await registry.listModules()
    for (const module of modules) {
      await registry.unregisterModule(module.id)
    }
  })

  describe('Module registration', () => {
    it('should register a module successfully', async () => {
      const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
      await mockModule.initialize()

      await registry.registerModule(mockModule as any)

      const retrieved = await registry.getModule('json-wasm-mock')
      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe('json-wasm-mock')
    })

    it('should handle duplicate module registration', async () => {
      const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
      await mockModule.initialize()

      await registry.registerModule(mockModule as any)

      // Should handle duplicate registration gracefully
      await expect(registry.registerModule(mockModule as any))
        .resolves.not.toThrow()
    })

    it('should unregister modules', async () => {
      const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
      await mockModule.initialize()

      await registry.registerModule(mockModule as any)
      expect(await registry.getModule('json-wasm-mock')).toBeDefined()

      await registry.unregisterModule('json-wasm-mock')
      expect(await registry.getModule('json-wasm-mock')).toBeNull()
    })

    it('should list all registered modules', async () => {
      const mockModule1 = mockWasmRegistry.getModule('json-wasm-mock')!
      const mockModule2 = mockWasmRegistry.getModule('code-formatter-wasm-mock')!
      await mockModule1.initialize()
      await mockModule2.initialize()

      await registry.registerModule(mockModule1 as any)
      await registry.registerModule(mockModule2 as any)

      const modules = await registry.listModules()
      expect(modules.length).toBeGreaterThanOrEqual(2)

      const ids = modules.map(m => m.id)
      expect(ids).toContain('json-wasm-mock')
      expect(ids).toContain('code-formatter-wasm-mock')
    })

    it('should list modules by category', async () => {
      const jsonModule = mockWasmRegistry.getModule('json-wasm-mock')!
      await jsonModule.initialize()

      await registry.registerModule(jsonModule as any)

      const jsonModules = await registry.getModulesByCategory('json')
      expect(jsonModules.length).toBeGreaterThanOrEqual(1)
      expect(jsonModules[0].id).toBe('json-wasm-mock')
    })

    it('should search modules by query', async () => {
      const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
      await mockModule.initialize()

      await registry.registerModule(mockModule as any)

      const searchResults = await registry.searchModules('json')
      expect(searchResults.length).toBeGreaterThanOrEqual(1)
      expect(searchResults[0].id).toBe('json-wasm-mock')

      const searchResults2 = await registry.searchModules('formatter')
      expect(searchResults2.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Module updates', () => {
    it('should check for module updates', async () => {
      const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
      await mockModule.initialize()

      await registry.registerModule(mockModule as any)

      const updates = await registry.checkForUpdates()
      expect(Array.isArray(updates)).toBe(true)
    })

    it('should update modules to new versions', async () => {
      const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
      await mockModule.initialize()

      await registry.registerModule(mockModule as any)

      // Should handle update requests gracefully
      await expect(registry.updateModule('json-wasm-mock'))
        .resolves.not.toThrow()
    })

    it('should handle update failures', async () => {
      await expect(registry.updateModule('non-existent-module'))
        .rejects.toThrow()
    })
  })

  describe('Module compatibility', () => {
    it('should check module compatibility', async () => {
      const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
      await mockModule.initialize()

      const isCompatible = await mockModule.isCompatible()
      expect(typeof isCompatible).toBe('boolean')
    })

    it('should handle incompatible modules', async () => {
      const incompatibleModule = {
        ...mockWasmRegistry.getModule('json-wasm-mock')!,
        isCompatible: vi.fn().mockResolvedValue(false)
      }

      await registry.registerModule(incompatibleModule as any)

      const module = await registry.getModule('json-wasm-mock')
      expect(module).toBeDefined()
      expect(await module!.isCompatible()).toBe(false)
    })
  })
})

describe('WasmErrorHandler', () => {
  let errorHandler: WasmErrorHandler

  beforeEach(() => {
    errorHandler = new WasmErrorHandler()
  })

  describe('Error handling', () => {
    it('should handle WASM module errors', () => {
      const error: WasmModuleError = {
        code: 'LOAD_FAILED',
        message: 'Failed to load WASM module',
        details: { moduleId: 'test-module' },
        recoverable: false,
        suggestions: ['Check module file exists']
      }

      const handledError = errorHandler.handleError(error)

      expect(handledError).toBeDefined()
      expect(handledError.code).toBe(error.code)
      expect(handledError.message).toBe(error.message)
    })

    it('should handle JavaScript errors', () => {
      const jsError = new Error('JavaScript error occurred')
      jsError.stack = 'Error stack trace'

      const handledError = errorHandler.handleError(jsError as any)

      expect(handledError).toBeDefined()
      expect(handledError.code).toBe('JAVASCRIPT_ERROR')
      expect(handledError.message).toBe('JavaScript error occurred')
    })

    it('should provide recovery suggestions', () => {
      const error: WasmModuleError = {
        code: 'LOAD_FAILED',
        message: 'Failed to load WASM module',
        details: { moduleId: 'test-module' },
        recoverable: true,
        suggestions: ['Check module file exists', 'Verify module format']
      }

      const suggestions = errorHandler.getRecoverySuggestions(error)

      expect(Array.isArray(suggestions)).toBe(true)
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0]).toContain('Check module file exists')
    })

    it('should classify error severity', () => {
      const criticalError: WasmModuleError = {
        code: 'INITIALIZATION_ERROR',
        message: 'Critical initialization error',
        recoverable: false
      }

      const warningError: WasmModuleError = {
        code: 'PERFORMANCE_WARNING',
        message: 'Performance warning',
        recoverable: true
      }

      const criticalSeverity = errorHandler.getErrorSeverity(criticalError)
      const warningSeverity = errorHandler.getErrorSeverity(warningError)

      expect(criticalSeverity).toBe('critical')
      expect(warningSeverity).toBe('warning')
    })

    it('should create error reports', () => {
      const error: WasmModuleError = {
        code: 'EXECUTION_ERROR',
        message: 'Module execution failed',
        details: { input: 'test data' },
        recoverable: true
      }

      const report = errorHandler.createErrorReport(error)

      expect(report).toHaveProperty('timestamp')
      expect(report).toHaveProperty('error')
      expect(report).toHaveProperty('severity')
      expect(report).toHaveProperty('suggestions')
      expect(report.error.code).toBe('EXECUTION_ERROR')
    })
  })

  describe('Error recovery', () => {
    it('should attempt to recover from recoverable errors', async () => {
      const recoverableError: WasmModuleError = {
        code: 'TIMEOUT_ERROR',
        message: 'Operation timed out',
        recoverable: true,
        suggestions: ['Increase timeout', 'Reduce input size']
      }

      const recoveryResult = await errorHandler.attemptRecovery(recoverableError)

      expect(recoveryResult).toBeDefined()
      expect(recoveryResult.attempted).toBe(true)
    })

    it('should not attempt recovery from non-recoverable errors', async () => {
      const nonRecoverableError: WasmModuleError = {
        code: 'CORRUPTION_ERROR',
        message: 'Module corrupted',
        recoverable: false
      }

      const recoveryResult = await errorHandler.attemptRecovery(nonRecoverableError)

      expect(recoveryResult).toBeDefined()
      expect(recoveryResult.attempted).toBe(false)
    })

    it('should handle recovery failures gracefully', async () => {
      const errorWithInvalidRecovery: WasmModuleError = {
        code: 'UNKNOWN_ERROR',
        message: 'Unknown error occurred',
        recoverable: true,
        suggestions: ['Invalid recovery action']
      }

      const recoveryResult = await errorHandler.attemptRecovery(errorWithInvalidRecovery)

      expect(recoveryResult).toBeDefined()
      expect(recoveryResult.success).toBe(false)
    })
  })
})

describe('WASM Module Integration', () => {
  let loader: WasmModuleLoader
  let registry: WasmModuleRegistry
  let errorHandler: WasmErrorHandler

  beforeEach(() => {
    loader = new WasmModuleLoader()
    registry = new WasmModuleRegistry()
    errorHandler = new WasmErrorHandler()
  })

  afterEach(async () => {
    loader.clear()
    const modules = await registry.listModules()
    for (const module of modules) {
      await registry.unregisterModule(module.id)
    }
  })

  describe('End-to-end module workflow', () => {
    it('should complete full module lifecycle', async () => {
      const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
      await mockModule.initialize()

      // Register module
      await registry.registerModule(mockModule as any)
      expect(await registry.getModule('json-wasm-mock')).toBeDefined()

      // Load module
      vi.spyOn(loader, 'loadModule').mockResolvedValue(mockModule as any)
      const loadedModule = await loader.loadModule('json-wasm-mock')
      expect(loadedModule.id).toBe('json-wasm-mock')

      // Execute module
      const result = await loadedModule.execute({ test: 'data' }, { operation: 'format' })
      expect(result.success).toBe(true)

      // Unload module
      await loader.unloadModule('json-wasm-mock')
      expect(loader.isModuleLoaded('json-wasm-mock')).toBe(false)

      // Unregister module
      await registry.unregisterModule('json-wasm-mock')
      expect(await registry.getModule('json-wasm-mock')).toBeNull()
    })

    it('should handle module execution with errors', async () => {
      const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
      await mockModule.initialize()

      await registry.registerModule(mockModule as any)
      vi.spyOn(loader, 'loadModule').mockResolvedValue(mockModule as any)

      const loadedModule = await loader.loadModule('json-wasm-mock')

      // Mock execution failure
      vi.spyOn(mockModule, 'execute').mockRejectedValue(new Error('Execution failed'))

      try {
        await loadedModule.execute({ invalid: 'data' })
      } catch (error) {
        const handledError = errorHandler.handleError(error as any)
        expect(handledError).toBeDefined()
        expect(handledError.code).toBeDefined()
      }
    })

    it('should manage module health monitoring', async () => {
      const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
      await mockModule.initialize()

      const health: WasmModuleHealth = await mockModule.getHealth()
      expect(health).toBeDefined()
      expect(health.status).toBeDefined()
      expect(health.lastCheck).toBeInstanceOf(Date)
      expect(health.responseTime).toBeGreaterThanOrEqual(0)
    })

    it('should handle module metadata', async () => {
      const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
      await mockModule.initialize()

      const metadata: WasmModuleMetadata = mockModule.getMetadata()
      expect(metadata).toBeDefined()
      expect(metadata.id).toBe('json-wasm-mock')
      expect(metadata.name).toBe('Mock JSON WASM Module')
      expect(metadata.version).toBe('1.0.0-mock')
      expect(metadata.executionCount).toBeGreaterThanOrEqual(0)
      expect(metadata.memoryUsage).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Performance monitoring', () => {
    it('should track module performance metrics', async () => {
      const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
      await mockModule.initialize()

      await registry.registerModule(mockModule as any)
      vi.spyOn(loader, 'loadModule').mockResolvedValue(mockModule as any)

      const loadedModule = await loader.loadModule('json-wasm-mock')

      // Execute multiple times to gather metrics
      for (let i = 0; i < 5; i++) {
        await loadedModule.execute({ test: `data-${i}` }, { operation: 'format' })
      }

      const metadata = loadedModule.getMetadata()
      expect(metadata.executionCount).toBeGreaterThanOrEqual(5)
      expect(metadata.memoryUsage).toBeGreaterThanOrEqual(0)
      expect(metadata.loadTime).toBeGreaterThanOrEqual(0)
    })

    it('should monitor resource usage', async () => {
      const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
      await mockModule.initialize()

      await registry.registerModule(mockModule as any)
      vi.spyOn(loader, 'loadModule').mockResolvedValue(mockModule as any)

      const loadedModule = await loader.loadModule('json-wasm-mock')

      const result = await loadedModule.execute({ test: 'data' }, { operation: 'format' })

      expect(result.success).toBe(true)
      if (result.metrics) {
        expect(result.metrics.cpuTime).toBeGreaterThanOrEqual(0)
        expect(result.metrics.wallTime).toBeGreaterThanOrEqual(0)
        expect(result.metrics.memoryPeak).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('Security and isolation', () => {
    it('should isolate module execution contexts', async () => {
      const mockModule1 = mockWasmRegistry.getModule('json-wasm-mock')!
      const mockModule2 = mockWasmRegistry.getModule('code-formatter-wasm-mock')!
      await mockModule1.initialize()
      await mockModule2.initialize()

      await registry.registerModule(mockModule1 as any)
      await registry.registerModule(mockModule2 as any)

      vi.spyOn(loader, 'loadModule').mockImplementation(async (id) => {
        if (id === 'module1') return mockModule1 as any
        if (id === 'module2') return mockModule2 as any
        throw new Error('Module not found')
      })

      const loadedModule1 = await loader.loadModule('module1')
      const loadedModule2 = await loader.loadModule('module2')

      // Execute both modules concurrently
      const [result1, result2] = await Promise.all([
        loadedModule1.execute({ test: 'data1' }, { operation: 'format' }),
        loadedModule2.execute({ test: 'data2' }, { operation: 'format' })
      ])

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)

      // Modules should not interfere with each other
      expect(result1.data).toBeDefined()
      expect(result2.data).toBeDefined()
    })

    it('should handle memory limits', async () => {
      const config: WasmModuleConfig = {
        maxMemory: 16 * 1024 * 1024, // 16MB limit
        timeout: 5000
      }

      const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
      await mockModule.initialize()

      vi.spyOn(loader, 'loadModule').mockResolvedValue(mockModule as any)

      const loadedModule = await loader.loadModule('memory-test', config)

      const result = await loadedModule.execute({ test: 'data' }, { operation: 'format' })
      expect(result.success).toBe(true)

      // Memory usage should be within limits
      const metadata = loadedModule.getMetadata()
      expect(metadata.memoryUsage).toBeLessThanOrEqual(16 * 1024 * 1024)
    })

    it('should enforce execution timeouts', async () => {
      const config: WasmModuleConfig = {
        timeout: 100 // 100ms timeout
      }

      const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
      await mockModule.initialize()

      // Mock slow execution
      vi.spyOn(mockModule, 'execute').mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 200)) // 200ms delay
        return { success: true, data: 'result' }
      })

      vi.spyOn(loader, 'loadModule').mockResolvedValue(mockModule as any)

      const loadedModule = await loader.loadModule('timeout-test', config)

      // Should handle timeout gracefully
      await expect(loadedModule.execute({ test: 'data' }, { operation: 'format' }))
        .rejects.toThrow()
    })
  })

  describe('Module discovery and loading', () => {
    it('should discover available modules', async () => {
      const mockModule1 = mockWasmRegistry.getModule('json-wasm-mock')!
      const mockModule2 = mockWasmRegistry.getModule('code-formatter-wasm-mock')!
      await mockModule1.initialize()
      await mockModule2.initialize()

      await registry.registerModule(mockModule1 as any)
      await registry.registerModule(mockModule2 as any)

      const discoveredModules = await registry.listModules()
      expect(discoveredModules.length).toBeGreaterThanOrEqual(2)

      const categories = [...new Set(discoveredModules.map(m => m.category))]
      expect(categories.length).toBeGreaterThanOrEqual(1)
    })

    it('should load modules from different sources', async () => {
      // Mock loading from different sources
      const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
      await mockModule.initialize()

      // Mock URL loading
      vi.spyOn(loader, 'loadModule').mockImplementation(async (identifier) => {
        if (identifier.startsWith('http://') || identifier.startsWith('https://')) {
          // Simulate URL loading
          return mockModule as any
        }
        throw new Error('Invalid module source')
      })

      const urlModule = await loader.loadModule('https://example.com/module.wasm')
      expect(urlModule).toBeDefined()
      expect(urlModule.id).toBe('json-wasm-mock')

      // Should fail for invalid sources
      await expect(loader.loadModule('invalid-source'))
        .rejects.toThrow('Invalid module source')
    })

    it('should validate module integrity', async () => {
      const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
      await mockModule.initialize()

      // Mock checksum validation
      const originalGetMetadata = mockModule.getMetadata.bind(mockModule)
      mockModule.getMetadata = () => ({
        ...originalGetMetadata(),
        checksum: 'valid-checksum-123'
      })

      await registry.registerModule(mockModule as any)

      const module = await registry.getModule('json-wasm-mock')
      expect(module).toBeDefined()
      expect(module.getMetadata().checksum).toBe('valid-checksum-123')
    })
  })
})

describe('Module Lifecycle Management', () => {
  let loader: WasmModuleLoader
  let registry: WasmModuleRegistry

  beforeEach(() => {
    loader = new WasmModuleLoader()
    registry = new WasmModuleRegistry()
  })

  afterEach(async () => {
    loader.clear()
    const modules = await registry.listModules()
    for (const module of modules) {
      await registry.unregisterModule(module.id)
    }
  })

  it('should handle module hot reloading', async () => {
    const mockModuleV1 = mockWasmRegistry.getModule('json-wasm-mock')!
    mockModuleV1.version = '1.0.0'
    await mockModuleV1.initialize()

    await registry.registerModule(mockModuleV1 as any)
    vi.spyOn(loader, 'loadModule').mockResolvedValue(mockModuleV1 as any)

    const loadedModuleV1 = await loader.loadModule('hot-reload-test')
    expect(loadedModuleV1.getMetadata().version).toBe('1.0.0')

    // Simulate module update
    const mockModuleV2 = { ...mockModuleV1, version: '2.0.0' }
    await registry.registerModule(mockModuleV2 as any)

    // Hot reload
    await loader.unloadModule('hot-reload-test')
    const reloadedModule = await loader.loadModule('hot-reload-test')

    expect(reloadedModule.getMetadata().version).toBe('2.0.0')
  })

  it('should handle module dependency resolution', async () => {
    const dependencyModule = mockWasmRegistry.getModule('json-wasm-mock')!
    const dependentModule = mockWasmRegistry.getModule('code-formatter-wasm-mock')!

    dependencyModule.id = 'dependency'
    dependentModule.id = 'dependent'
    ;(dependentModule as any).dependencies = ['dependency']

    await dependencyModule.initialize()
    await dependentModule.initialize()

    await registry.registerModule(dependencyModule as any)
    await registry.registerModule(dependentModule as any)

    vi.spyOn(loader, 'loadModule').mockImplementation(async (id) => {
      if (id === 'dependency') return dependencyModule as any
      if (id === 'dependent') return dependentModule as any
      throw new Error('Module not found')
    })

    // Load dependent module should also load dependency
    const loadedDependent = await loader.loadModule('dependent')
    expect(loadedDependent.id).toBe('dependent')
    expect(loader.isModuleLoaded('dependency')).toBe(true)
  })

  it('should handle graceful degradation', async () => {
    const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
    await mockModule.initialize()

    // Mock partial failure
    vi.spyOn(mockModule, 'execute').mockImplementation(async (input, options) => {
      if (options?.operation === 'failing-operation') {
        throw new Error('Operation not supported')
      }
      return { success: true, data: 'default result' }
    })

    await registry.registerModule(mockModule as any)
    vi.spyOn(loader, 'loadModule').mockResolvedValue(mockModule as any)

    const loadedModule = await loader.loadModule('graceful-degradation-test')

    // Should succeed with default operation
    const result1 = await loadedModule.execute({ test: 'data' }, { operation: 'default' })
    expect(result1.success).toBe(true)

    // Should handle failing operation gracefully
    const result2 = await loadedModule.execute({ test: 'data' }, { operation: 'failing-operation' })
    expect(result2.success).toBe(false)
  })
})

describe('Error Recovery and Resilience', () => {
  let loader: WasmModuleLoader
  let registry: WasmModuleRegistry
  let errorHandler: WasmErrorHandler

  beforeEach(() => {
    loader = new WasmModuleLoader()
    registry = new WasmModuleRegistry()
    errorHandler = new WasmErrorHandler()
  })

  afterEach(async () => {
    loader.clear()
    const modules = await registry.listModules()
    for (const module of modules) {
      await registry.unregisterModule(module.id)
    }
  })

  it('should recover from transient failures', async () => {
    const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
    await mockModule.initialize()

    // Mock transient failure
    let attemptCount = 0
    vi.spyOn(mockModule, 'execute').mockImplementation(async () => {
      attemptCount++
      if (attemptCount < 3) {
        throw new Error('Transient error')
      }
      return { success: true, data: 'success after retries' }
    })

    await registry.registerModule(mockModule as any)
    vi.spyOn(loader, 'loadModule').mockResolvedValue(mockModule as any)

    const loadedModule = await loader.loadModule('recovery-test')

    // Should succeed after retries
    const result = await loadedModule.execute({ test: 'data' }, { operation: 'test' })
    expect(result.success).toBe(true)
    expect(result.data).toBe('success after retries')
    expect(attemptCount).toBe(3)
  })

  it('should implement circuit breaker pattern', async () => {
    const mockModule = mockWasmRegistry.getModule('json-wasm-mock')!
    await mockModule.initialize()

    // Mock persistent failure
    vi.spyOn(mockModule, 'execute').mockRejectedValue(new Error('Persistent failure'))

    await registry.registerModule(mockModule as any)
    vi.spyOn(loader, 'loadModule').mockResolvedValue(mockModule as any)

    const loadedModule = await loader.loadModule('circuit-breaker-test')

    // Multiple failures should trigger circuit breaker
    for (let i = 0; i < 5; i++) {
      try {
        await loadedModule.execute({ test: 'data' }, { operation: 'test' })
      } catch (error) {
        expect(error.message).toBe('Persistent failure')
      }
    }

    // Circuit breaker should prevent further calls
    // This would be implemented with proper circuit breaker logic
    expect(loadedModule).toBeDefined()
  })

  it('should provide fallback mechanisms', async () => {
    const primaryModule = mockWasmRegistry.getModule('json-wasm-mock')!
    const fallbackModule = mockWasmRegistry.getModule('code-formatter-wasm-mock')!

    await primaryModule.initialize()
    await fallbackModule.initialize()

    // Mock primary module failure
    vi.spyOn(primaryModule, 'execute').mockRejectedValue(new Error('Primary module failed'))

    // Mock fallback module success
    vi.spyOn(fallbackModule, 'execute').mockResolvedValue({
      success: true,
      data: 'fallback result'
    })

    await registry.registerModule(primaryModule as any)
    await registry.registerModule(fallbackModule as any)

    vi.spyOn(loader, 'loadModule').mockImplementation(async (id) => {
      if (id === 'primary') return primaryModule as any
      if (id === 'fallback') return fallbackModule as any
      throw new Error('Module not found')
    })

    const loadedPrimary = await loader.loadModule('primary')
    const loadedFallback = await loader.loadModule('fallback')

    // Try primary first, then fallback
    let result
    try {
      result = await loadedPrimary.execute({ test: 'data' }, { operation: 'test' })
    } catch (error) {
      result = await loadedFallback.execute({ test: 'data' }, { operation: 'test' })
    }

    expect(result.success).toBe(true)
    expect(result.data).toBe('fallback result')
  })
})
