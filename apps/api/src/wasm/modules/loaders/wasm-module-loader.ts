import {
  type IWasmModule,
  type IWasmModuleLoader,
  type WasmModuleConfig,
  WasmModuleError,
} from '../interfaces/wasm-module.interface'

/**
 * WebAssembly module loader implementation
 */
export class WasmModuleLoader implements IWasmModuleLoader {
  private loadedModules: Map<string, IWasmModule> = new Map()
  private moduleInstances: Map<string, WebAssembly.Instance> = new Map()
  private moduleMemories: Map<string, WebAssembly.Memory> = new Map()
  private loadingPromises: Map<string, Promise<IWasmModule>> = new Map()
  private defaultConfig: WasmModuleConfig = {
    maxMemory: 64 * 1024 * 1024, // 64MB
    timeout: 30000, // 30 seconds
    debug: false,
    logLevel: 'error',
  }

  /**
   * Load a module by ID or URL
   */
  async loadModule(identifier: string, config?: WasmModuleConfig): Promise<IWasmModule> {
    // Check if already loading
    if (this.loadingPromises.has(identifier)) {
      return this.loadingPromises.get(identifier)!
    }

    // Check if already loaded
    if (this.loadedModules.has(identifier)) {
      return this.loadedModules.get(identifier)!
    }

    // Create loading promise
    const loadingPromise = this.doLoadModule(identifier, config)
    this.loadingPromises.set(identifier, loadingPromise)

    try {
      const module = await loadingPromise
      this.loadedModules.set(identifier, module)
      this.loadingPromises.delete(identifier)
      return module
    } catch (error) {
      this.loadingPromises.delete(identifier)
      throw error
    }
  }

  /**
   * Internal module loading implementation
   */
  private async doLoadModule(identifier: string, config?: WasmModuleConfig): Promise<IWasmModule> {
    const mergedConfig = { ...this.defaultConfig, ...config }

    try {
      // Determine if identifier is a URL, file path, or module ID
      const moduleSource = await this.resolveModuleSource(identifier)

      // Compile and instantiate WASM module
      const { instance, memory } = await this.compileAndInstantiate(moduleSource, mergedConfig)

      // Create module wrapper
      const module = await this.createModuleWrapper(identifier, instance, memory, mergedConfig)

      // Initialize module
      await module.initialize(mergedConfig.options)

      // Store references
      this.moduleInstances.set(identifier, instance)
      this.moduleMemories.set(identifier, memory)

      return module
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new WasmModuleError({
        code: 'LOAD_FAILED',
        message: `Failed to load WASM module '${identifier}': ${errorMessage}`,
        details: { identifier, config: mergedConfig },
        recoverable: false,
        suggestions: [
          'Check if the module file exists and is accessible',
          'Verify the module format is correct',
          'Ensure sufficient memory is available',
          'Check for compatibility issues',
        ],
      })
    }
  }

  /**
   * Resolve module source from identifier
   */
  private async resolveModuleSource(identifier: string): Promise<ArrayBuffer> {
    try {
      // Handle different identifier formats
      if (identifier.startsWith('http://') || identifier.startsWith('https://')) {
        // Load from URL
        return this.fetchModuleFromUrl(identifier)
      } else if (identifier.startsWith('file://') || identifier.startsWith('/')) {
        // Load from file path
        return this.loadModuleFromFile(identifier)
      } else {
        // Try to resolve as a built-in module ID
        return this.loadBuiltinModule(identifier)
      }
    } catch (error) {
      throw new Error(
        `Failed to resolve module source '${identifier}': ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Fetch module from URL
   */
  private async fetchModuleFromUrl(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/wasm',
        'Cache-Control': 'no-cache',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    if (!response.body) {
      throw new Error('Response body is empty')
    }

    return response.arrayBuffer()
  }

  /**
   * Load module from file path
   */
  private async loadModuleFromFile(_path: string): Promise<ArrayBuffer> {
    // In a real implementation, this would use the file system API
    // For Cloudflare Workers, this might load from assets or KV storage
    throw new Error('File loading not yet implemented in this environment')
  }

  /**
   * Load built-in module
   */
  private async loadBuiltinModule(moduleId: string): Promise<ArrayBuffer> {
    // Map of built-in module IDs to their implementations
    // In a real implementation, these would be actual WASM files
    const builtinModules: Record<string, string> = {
      'json-formatter': 'builtin:json-formatter',
      'json-validator': 'builtin:json-validator',
      'code-executor': 'builtin:code-executor',
      'code-formatter': 'builtin:code-formatter',
    }

    const moduleKey = builtinModules[moduleId]
    if (!moduleKey) {
      throw new Error(`Built-in module '${moduleId}' not found`)
    }

    // For now, return a placeholder
    // In a real implementation, this would load the actual WASM binary
    throw new Error(`Built-in module loading not yet implemented for '${moduleId}'`)
  }

  /**
   * Compile and instantiate WASM module
   */
  private async compileAndInstantiate(
    source: ArrayBuffer,
    config: WasmModuleConfig
  ): Promise<{ instance: WebAssembly.Instance; memory: WebAssembly.Memory }> {
    try {
      // Create WASM memory
      const memory = new WebAssembly.Memory({
        initial: Math.ceil((config.maxMemory || this.defaultConfig.maxMemory!) / (64 * 1024)),
        maximum: Math.ceil((config.maxMemory || this.defaultConfig.maxMemory!) / (64 * 1024)),
        shared: false,
      })

      // Create import object
      const importObject = this.createImportObject(memory, config)

      // Compile module with streaming if possible
      let module: WebAssembly.Module
      if (WebAssembly.compileStreaming) {
        const response = new Response(source)
        module = await WebAssembly.compileStreaming(response)
      } else {
        module = await WebAssembly.compile(source)
      }

      // Instantiate module
      const instance = await WebAssembly.instantiate(module, importObject)

      return { instance, memory }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to compile and instantiate WASM module: ${errorMessage}`)
    }
  }

  /**
   * Create import object for WASM instantiation
   */
  private createImportObject(memory: WebAssembly.Memory, config: WasmModuleConfig): any {
    const env = {
      memory,
      // Common WASM imports
      abort: () => {
        throw new Error('WASM module aborted')
      },
      log: (ptr: number, len: number) => {
        if (config.debug || config.logLevel !== 'none') {
          const message = this.readStringFromMemory(memory, ptr, len)
          console.log(`[WASM] ${message}`)
        }
      },
      error: (ptr: number, len: number) => {
        const message = this.readStringFromMemory(memory, ptr, len)
        console.error(`[WASM Error] ${message}`)
      },
      warn: (ptr: number, len: number) => {
        if (
          config.logLevel === 'warn' ||
          config.logLevel === 'info' ||
          config.logLevel === 'debug'
        ) {
          const message = this.readStringFromMemory(memory, ptr, len)
          console.warn(`[WASM Warning] ${message}`)
        }
      },
      // Memory management
      memory_grow: (delta: number) => memory.grow(delta),
      memory_size: () => memory.buffer.byteLength,
      // Time functions
      now: () => Date.now(),
      // Random number generation
      random: () => Math.random(),
    }

    // Additional imports based on configuration
    const imports: any = { env }

    // Add debug imports if debug mode is enabled
    if (config.debug) {
      imports.debug = {
        print: (ptr: number, len: number) => {
          const message = this.readStringFromMemory(memory, ptr, len)
          console.debug(`[WASM Debug] ${message}`)
        },
        trace: (ptr: number, len: number) => {
          const message = this.readStringFromMemory(memory, ptr, len)
          console.trace(`[WASM Trace] ${message}`)
        },
      }
    }

    return imports
  }

  /**
   * Read string from WASM memory
   */
  private readStringFromMemory(memory: WebAssembly.Memory, ptr: number, len: number): string {
    const buffer = new Uint8Array(memory.buffer, ptr, len)
    return new TextDecoder().decode(buffer)
  }

  /**
   * Create module wrapper around WASM instance
   */
  private async createModuleWrapper(
    identifier: string,
    instance: WebAssembly.Instance,
    memory: WebAssembly.Memory,
    config: WasmModuleConfig
  ): Promise<IWasmModule> {
    // Extract module metadata from WASM exports
    const exports = instance.exports

    // Check for required exports
    if (!exports.initialize || !exports.execute || !exports.dispose) {
      throw new Error('WASM module missing required exports (initialize, execute, dispose)')
    }

    // Create module wrapper implementation
    return new WasmModuleWrapper(identifier, instance, memory, config)
  }

  /**
   * Unload a module
   */
  async unloadModule(moduleId: string): Promise<void> {
    if (!this.loadedModules.has(moduleId)) {
      throw new Error(`Module '${moduleId}' is not loaded`)
    }

    try {
      const module = this.loadedModules.get(moduleId)!

      // Dispose module
      await module.dispose()

      // Remove from collections
      this.loadedModules.delete(moduleId)
      this.moduleInstances.delete(moduleId)
      this.moduleMemories.delete(moduleId)

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
    } catch (error) {
      throw new Error(
        `Failed to unload module '${moduleId}': ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Check if a module is loaded
   */
  isModuleLoaded(moduleId: string): boolean {
    return this.loadedModules.has(moduleId)
  }

  /**
   * Get list of loaded modules
   */
  getLoadedModules(): string[] {
    return Array.from(this.loadedModules.keys())
  }

  /**
   * Preload modules for faster execution
   */
  async preloadModules(moduleIds: string[]): Promise<void> {
    const preloadPromises = moduleIds.map(moduleId =>
      this.loadModule(moduleId).catch(error => {
        console.warn(`Failed to preload module '${moduleId}':`, error)
        return null
      })
    )

    const results = await Promise.allSettled(preloadPromises)
    const successful = results.filter(result => result.status === 'fulfilled').length
    const failed = results.length - successful

    console.log(`Preloading completed: ${successful} successful, ${failed} failed`)
  }

  /**
   * Clear all loaded modules
   */
  async clear(): Promise<void> {
    const moduleIds = Array.from(this.loadedModules.keys())

    for (const moduleId of moduleIds) {
      try {
        await this.unloadModule(moduleId)
      } catch (error) {
        console.error(`Failed to unload module '${moduleId}' during clear:`, error)
      }
    }
  }

  /**
   * Get loader statistics
   */
  getLoaderStats(): {
    loadedModules: number
    totalMemoryUsage: number
    loadingInProgress: number
  } {
    let totalMemoryUsage = 0

    for (const memory of this.moduleMemories.values()) {
      totalMemoryUsage += memory.buffer.byteLength
    }

    return {
      loadedModules: this.loadedModules.size,
      totalMemoryUsage,
      loadingInProgress: this.loadingPromises.size,
    }
  }

  /**
   * Set default configuration
   */
  setDefaultConfig(config: Partial<WasmModuleConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config }
  }

  /**
   * Get current configuration
   */
  getDefaultConfig(): WasmModuleConfig {
    return { ...this.defaultConfig }
  }
}

/**
 * WASM module wrapper implementation
 */
class WasmModuleWrapper implements IWasmModule {
  private instance: WebAssembly.Instance
  private memory: WebAssembly.Memory
  private config: WasmModuleConfig
  private _initialized = false
  private _metadata: WasmModuleMetadata
  private executionCount = 0
  private lastUsedAt?: Date
  private createdAt: Date

  constructor(
    public readonly id: string,
    instance: WebAssembly.Instance,
    memory: WebAssembly.Memory,
    config: WasmModuleConfig
  ) {
    this.instance = instance
    this.memory = memory
    this.config = config
    this.createdAt = new Date()

    // Extract metadata from WASM module
    this._metadata = this.extractMetadata()
  }

  get name(): string {
    return this._metadata.name
  }

  get version(): string {
    return this._metadata.version
  }

  get description(): string {
    return this._metadata.description
  }

  get category(): string {
    return this._metadata.category
  }

  get authors(): string[] {
    return this._metadata.authors
  }

  get dependencies(): string[] {
    return this._metadata.dependencies
  }

  get apiVersion(): string {
    return this._metadata.apiVersion
  }

  async isCompatible(): Promise<boolean> {
    try {
      // Check API version compatibility
      const currentApiVersion = '1.0.0' // This should match the runtime API version
      return this.isVersionCompatible(this.apiVersion, currentApiVersion)
    } catch (_error) {
      return false
    }
  }

  async initialize(config?: any): Promise<void> {
    if (this._initialized) {
      return
    }

    try {
      const exports = this.instance.exports as any

      // Call WASM initialize function
      if (exports.initialize) {
        const configPtr = this.writeStringToMemory(JSON.stringify(config || {}))
        const result = exports.initialize(configPtr)

        if (result !== 0) {
          throw new Error(`WASM initialization failed with code ${result}`)
        }
      }

      this._initialized = true
    } catch (error) {
      throw new Error(
        `Module initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  isInitialized(): boolean {
    return this._initialized
  }

  getMetadata(): WasmModuleMetadata {
    return {
      ...this._metadata,
      initializedAt: this._initialized ? this.createdAt : undefined,
      lastUsedAt: this.lastUsedAt,
      executionCount: this.executionCount,
      memoryUsage: this.memory.buffer.byteLength,
      loadTime: 0, // This would be measured during loading
      size: 0, // This would be measured during loading
      checksum: '', // This would be calculated during loading
      supportedFormats: [], // This would be extracted from the module
      capabilities: [], // This would be extracted from the module
      limitations: [], // This would be extracted from the module
    }
  }

  async execute(input: any, options?: any): Promise<any> {
    if (!this._initialized) {
      throw new Error('Module is not initialized')
    }

    this.executionCount++
    this.lastUsedAt = new Date()

    try {
      const exports = this.instance.exports as any

      // Prepare input
      const inputStr = JSON.stringify(input)
      const optionsStr = JSON.stringify(options || {})
      const inputPtr = this.writeStringToMemory(inputStr)
      const optionsPtr = this.writeStringToMemory(optionsStr)

      // Execute with timeout
      const result = await this.executeWithTimeout(
        () => exports.execute(inputPtr, optionsPtr),
        this.config.timeout || 30000
      )

      // Read result from memory
      const resultPtr = result
      const resultLength = this.getMemoryValue(resultPtr + 4, 'u32')
      const resultData = this.readStringFromMemory(resultPtr + 8, resultLength)

      // Parse result
      return JSON.parse(resultData)
    } catch (error) {
      throw new Error(
        `Module execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async dispose(): Promise<void> {
    if (!this._initialized) {
      return
    }

    try {
      const exports = this.instance.exports as any

      // Call WASM dispose function
      if (exports.dispose) {
        exports.dispose()
      }

      this._initialized = false
    } catch (error) {
      console.warn('Module disposal failed:', error)
    }
  }

  async getHealth(): Promise<any> {
    return {
      status: this._initialized ? 'healthy' : 'unhealthy',
      lastCheck: new Date(),
      responseTime: 0, // This would be measured
      memoryUsage: this.memory.buffer.byteLength,
      errorRate: 0, // This would be calculated
      uptime: this._initialized ? Date.now() - this.createdAt.getTime() : 0,
    }
  }

  private extractMetadata(): WasmModuleMetadata {
    const _exports = this.instance.exports as any

    // Try to extract metadata from WASM exports
    // This is a simplified implementation
    return {
      id: this.id,
      name: this.id,
      version: '1.0.0',
      description: 'WASM module',
      category: 'unknown',
      authors: [],
      dependencies: [],
      apiVersion: '1.0.0',
      executionCount: 0,
      memoryUsage: 0,
      loadTime: 0,
      size: 0,
      checksum: '',
      supportedFormats: [],
      capabilities: [],
      limitations: [],
    }
  }

  private writeStringToMemory(str: string): number {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(str)
    const ptr = this.allocateMemory(bytes.length)
    new Uint8Array(this.memory.buffer, ptr, bytes.length).set(bytes)
    return ptr
  }

  private readStringFromMemory(ptr: number, len: number): string {
    const bytes = new Uint8Array(this.memory.buffer, ptr, len)
    const decoder = new TextDecoder()
    return decoder.decode(bytes)
  }

  private allocateMemory(size: number): number {
    // This is a simplified memory allocation
    // In a real implementation, this would use a proper memory allocator
    const exports = this.instance.exports as any
    if (exports.malloc) {
      return exports.malloc(size)
    }
    throw new Error('Memory allocator not available')
  }

  private getMemoryValue(ptr: number, type: 'u32' | 'u64' = 'u32'): number {
    const view = new DataView(this.memory.buffer)
    if (type === 'u32') {
      return view.getUint32(ptr, true)
    } else {
      return view.getBigUint64(ptr, true) as number
    }
  }

  private async executeWithTimeout(fn: () => number, timeoutMs: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Module execution timeout'))
      }, timeoutMs)

      try {
        const result = fn()
        clearTimeout(timer)
        resolve(result)
      } catch (error) {
        clearTimeout(timer)
        reject(error)
      }
    })
  }

  private isVersionCompatible(moduleApiVersion: string, runtimeApiVersion: string): boolean {
    const parseVersion = (version: string) => {
      const [major, minor, patch] = version.split('.').map(Number)
      return { major, minor, patch }
    }

    const moduleVer = parseVersion(moduleApiVersion)
    const runtimeVer = parseVersion(runtimeApiVersion)

    // Major version must match
    if (moduleVer.major !== runtimeVer.major) {
      return false
    }

    // Runtime minor version must be >= module minor version
    if (runtimeVer.minor < moduleVer.minor) {
      return false
    }

    return true
  }
}

// Create singleton loader instance
export const wasmModuleLoader = new WasmModuleLoader()
