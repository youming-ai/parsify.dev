/**
 * Base interface for all WASM modules
 */
export interface IWasmModule {
  /**
   * Unique identifier for the module
   */
  readonly id: string

  /**
   * Human-readable name of the module
   */
  readonly name: string

  /**
   * Module version following semantic versioning
   */
  readonly version: string

  /**
   * Brief description of what the module does
   */
  readonly description: string

  /**
   * Module category (e.g., 'json', 'code', 'data', 'transform')
   */
  readonly category: string

  /**
   * List of authors/maintainers
   */
  readonly authors: string[]

  /**
   * Module dependencies (other modules it requires)
   */
  readonly dependencies: string[]

  /**
   * Required API version for compatibility
   */
  readonly apiVersion: string

  /**
   * Check if the module is compatible with the current environment
   */
  isCompatible(): Promise<boolean>

  /**
   * Initialize the module with optional configuration
   */
  initialize(config?: any): Promise<void>

  /**
   * Check if the module is initialized and ready
   */
  isInitialized(): boolean

  /**
   * Get module metadata
   */
  getMetadata(): WasmModuleMetadata

  /**
   * Execute the module's primary function
   */
  execute(input: any, options?: any): Promise<WasmModuleResult>

  /**
   * Cleanup resources and terminate the module
   */
  dispose(): Promise<void>

  /**
   * Get module health status
   */
  getHealth(): WasmModuleHealth
}

/**
 * Module metadata interface
 */
export interface WasmModuleMetadata {
  id: string
  name: string
  version: string
  description: string
  category: string
  authors: string[]
  dependencies: string[]
  apiVersion: string
  initializedAt?: Date
  lastUsedAt?: Date
  executionCount: number
  memoryUsage: number
  loadTime: number
  size: number
  checksum: string
  supportedFormats: string[]
  capabilities: string[]
  limitations: string[]
}

/**
 * Module execution result interface
 */
export interface WasmModuleResult {
  /**
   * Whether the execution was successful
   */
  success: boolean

  /**
   * The primary output data
   */
  data?: any

  /**
   * Additional metadata about the result
   */
  metadata?: {
    executionTime: number
    memoryUsage: number
    outputSize: number
    processedItems: number
    warnings?: string[]
  }

  /**
   * Error information if execution failed
   */
  error?: WasmModuleError

  /**
   * Performance metrics
   */
  metrics?: {
    cpuTime: number
    wallTime: number
    memoryPeak: number
    operationsPerSecond: number
  }
}

/**
 * Module error interface
 */
export interface WasmModuleError {
  code: string
  message: string
  details?: any
  stack?: string
  recoverable: boolean
  suggestions?: string[]
}

/**
 * Module health status interface
 */
export interface WasmModuleHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  lastCheck: Date
  responseTime: number
  memoryUsage: number
  errorRate: number
  uptime: number
  details?: {
    [key: string]: any
  }
}

/**
 * Module configuration interface
 */
export interface WasmModuleConfig {
  /**
   * Maximum memory allocation in bytes
   */
  maxMemory?: number

  /**
   * Execution timeout in milliseconds
   */
  timeout?: number

  /**
   * Whether to enable debug mode
   */
  debug?: boolean

  /**
   * Log level
   */
  logLevel?: 'none' | 'error' | 'warn' | 'info' | 'debug'

  /**
   * Custom configuration options
   */
  options?: {
    [key: string]: any
  }
}

/**
 * Module loader interface
 */
export interface IWasmModuleLoader {
  /**
   * Load a module by ID or URL
   */
  loadModule(identifier: string, config?: WasmModuleConfig): Promise<IWasmModule>

  /**
   * Unload a module
   */
  unloadModule(moduleId: string): Promise<void>

  /**
   * Check if a module is loaded
   */
  isModuleLoaded(moduleId: string): boolean

  /**
   * Get list of loaded modules
   */
  getLoadedModules(): string[]

  /**
   * Preload modules for faster execution
   */
  preloadModules(moduleIds: string[]): Promise<void>

  /**
   * Clear all loaded modules
   */
  clear(): Promise<void>
}

/**
 * Module registry interface
 */
export interface IWasmModuleRegistry {
  /**
   * Register a new module
   */
  registerModule(module: IWasmModule): Promise<void>

  /**
   * Unregister a module
   */
  unregisterModule(moduleId: string): Promise<void>

  /**
   * Get a module by ID
   */
  getModule(moduleId: string): Promise<IWasmModule | null>

  /**
   * List all registered modules
   */
  listModules(category?: string): Promise<IWasmModule[]>

  /**
   * Search modules by name, description, or tags
   */
  searchModules(query: string): Promise<IWasmModule[]>

  /**
   * Get modules by category
   */
  getModulesByCategory(category: string): Promise<IWasmModule[]>

  /**
   * Check for module updates
   */
  checkForUpdates(): Promise<ModuleUpdate[]>

  /**
   * Update a module to a new version
   */
  updateModule(moduleId: string, version?: string): Promise<void>
}

/**
 * Module update information
 */
export interface ModuleUpdate {
  moduleId: string
  currentVersion: string
  availableVersion: string
  updateType: 'patch' | 'minor' | 'major' | 'security'
  description: string
  breakingChanges: boolean
  requiredActions?: string[]
}

/**
 * Module execution context interface
 */
export interface IWasmModuleContext {
  /**
   * Unique execution ID
   */
  executionId: string

  /**
   * Module being executed
   */
  module: IWasmModule

  /**
   * Input data
   */
  input: any

  /**
   * Execution options
   */
  options: any

  /**
   * Execution start time
   */
  startTime: Date

  /**
   * Current execution status
   */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

  /**
   * Execution result (when completed)
   */
  result?: WasmModuleResult

  /**
   * Execution logs
   */
  logs: string[]

  /**
   * Cancel the execution
   */
  cancel(): void

  /**
   * Get execution progress (0-100)
   */
  getProgress(): number
}

/**
 * Module performance metrics
 */
export interface WasmModuleMetrics {
  /**
   * Total execution count
   */
  executionCount: number

  /**
   * Successful execution count
   */
  successCount: number

  /**
   * Failed execution count
   */
  failureCount: number

  /**
   * Average execution time in milliseconds
   */
  averageExecutionTime: number

  /**
   * Average memory usage in bytes
   */
  averageMemoryUsage: number

  /**
   * Peak memory usage in bytes
   */
  peakMemoryUsage: number

  /**
   * Total CPU time in milliseconds
   */
  totalCpuTime: number

  /**
   * Error rate as percentage (0-100)
   */
  errorRate: number

  /**
   * Last execution timestamp
   */
  lastExecutionAt?: Date

  /**
   * Metrics collection period start
   */
  periodStart: Date

  /**
   * Metrics collection period end
   */
  periodEnd: Date
}
