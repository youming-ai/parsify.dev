/**
 * JSON service with memory optimization
 */

import { z } from 'zod'
import {
  type JsonConversionOptions,
  type JsonConversionResult,
  JsonConverter,
} from './json_converter'
import {
  JsonFormatter,
  type JsonFormattingOptions,
  type JsonFormattingResult,
} from './json_formatter'
import {
  type JsonValidationOptions,
  type JsonValidationResult,
  JsonValidator,
} from './json_validator'
import {
  cleanupMemoryOptimization,
  getMemoryReport,
  initializeMemoryOptimization,
  MemoryEfficientCache,
  memoryLeakDetector,
  wasmMemoryManager,
  wasmMemoryMonitor,
} from './optimization'

// Enhanced configuration schemas with memory optimization options
export const JsonServiceConfigSchema = z.object({
  enableMemoryOptimization: z.boolean().default(true),
  memoryLimit: z
    .number()
    .int()
    .min(1024 * 1024)
    .max(1024 * 1024 * 1024)
    .default(64 * 1024 * 1024), // 64MB default
  enableLeakDetection: z.boolean().default(true),
  enableMemoryMonitoring: z.boolean().default(true),
  enableMemoryProfiling: z.boolean().default(true),
  gcStrategy: z.enum(['conservative', 'balanced', 'aggressive']).default('balanced'),
  cacheEnabled: z.boolean().default(true),
  cacheMaxSize: z.number().int().min(10).max(10000).default(1000),
  cacheTTL: z.number().int().min(1000).max(3600000).default(300000), // 5 minutes default
  maxInputSize: z
    .number()
    .int()
    .min(1024)
    .max(100 * 1024 * 1024)
    .default(10 * 1024 * 1024), // 10MB default
  enableStreamProcessing: z.boolean().default(true),
  streamChunkSize: z
    .number()
    .int()
    .min(1024)
    .max(1024 * 1024)
    .default(64 * 1024), // 64KB chunks
  enableObjectPooling: z.boolean().default(true),
  poolMaxSize: z.number().int().min(10).max(1000).default(100),
})

export type JsonServiceConfig = z.infer<typeof JsonServiceConfigSchema>

// Memory usage statistics
export interface JsonMemoryStats {
  serviceId: string
  formatterMemory: number
  validatorMemory: number
  converterMemory: number
  cacheMemory: number
  totalMemory: number
  peakMemory: number
  allocationCount: number
  deallocationCount: number
  leakProbability: number
  efficiency: number
  gcStats: {
    totalGCs: number
    totalGCTime: number
    memoryReclaimed: number
  }
  timestamp: Date
}

// Performance metrics with memory information
export interface JsonPerformanceMetrics {
  operation: 'format' | 'validate' | 'convert'
  inputSize: number
  outputSize: number
  processingTime: number
  memoryUsed: number
  memoryPeak: number
  cacheHit: boolean
  streamProcessed: boolean
  objectsPooled: number
  efficiency: number
}

/**
 * Memory-optimized JSON service
 */
export class JsonOptimizer {
  private static instances = new Map<string, JsonOptimizer>()

  private readonly serviceId: string
  private readonly config: JsonServiceConfig
  private formatter: JsonFormatter
  private validator: JsonValidator
  private converter: JsonConverter
  private cache: MemoryEfficientCache<string, any> | null = null
  private isInitialized = false
  private metrics: JsonPerformanceMetrics[] = []
  private maxMetrics = 1000

  constructor(config: Partial<JsonServiceConfig> = {}) {
    const validatedConfig = JsonServiceConfigSchema.parse(config)
    this.config = validatedConfig
    this.serviceId = `json-service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    this.formatter = new JsonFormatter()
    this.validator = new JsonValidator()
    this.converter = new JsonConverter()
  }

  /**
   * Get or create a singleton instance
   */
  static getInstance(config?: Partial<JsonServiceConfig>): JsonOptimizer {
    const configKey = JSON.stringify(config || {})

    if (!JsonOptimizer.instances.has(configKey)) {
      JsonOptimizer.instances.set(configKey, new JsonOptimizer(config))
    }

    return JsonOptimizer.instances.get(configKey)!
  }

  /**
   * Initialize the JSON service with memory optimization
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // Initialize memory optimization
      if (this.config.enableMemoryOptimization) {
        await this.initializeMemoryOptimization()
      }

      // Initialize cache
      if (this.config.cacheEnabled) {
        this.cache = new MemoryEfficientCache(this.config.cacheMaxSize, this.config.cacheTTL)
      }

      // Initialize underlying services
      await Promise.all([
        this.formatter.initialize(),
        this.validator.initialize(),
        this.converter.initialize(),
      ])

      // Configure services with memory limits
      this.configureServices()

      this.isInitialized = true
    } catch (error) {
      throw new Error(
        `Failed to initialize JSON optimizer: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Format JSON with memory optimization
   */
  async format(
    jsonString: string,
    options: Partial<JsonFormattingOptions> = {}
  ): Promise<JsonFormattingResult> {
    await this.ensureInitialized()

    const startTime = performance.now()
    let memoryUsed = 0
    let memoryPeak = 0
    let cacheHit = false
    let streamProcessed = false

    try {
      // Check cache first
      if (this.cache) {
        const cacheKey = this.generateCacheKey('format', jsonString, options)
        const cached = this.cache.get(cacheKey)
        if (cached) {
          cacheHit = true
          return cached
        }
      }

      // Check memory availability
      const inputSize = jsonString.length
      if (inputSize > this.config.maxInputSize) {
        throw new Error(
          `Input size (${inputSize}) exceeds maximum allowed size (${this.config.maxInputSize})`
        )
      }

      // Record allocation
      if (this.config.enableMemoryOptimization) {
        wasmMemoryManager.recordAllocation(this.serviceId, inputSize)
      }

      // Use stream processing for large inputs
      let result: JsonFormattingResult
      if (this.config.enableStreamProcessing && inputSize > this.config.streamChunkSize) {
        streamProcessed = true
        result = await this.formatWithStreaming(jsonString, options)
      } else {
        result = await this.formatter.format(jsonString, options)
      }

      // Cache the result
      if (this.cache && result.success && result.formatted) {
        const cacheKey = this.generateCacheKey('format', jsonString, options)
        this.cache.set(cacheKey, result)
      }

      // Record deallocation
      if (this.config.enableMemoryOptimization) {
        const outputSize = result.formatted?.length || 0
        wasmMemoryManager.recordDeallocation(this.serviceId, inputSize + outputSize)
      }

      // Get memory usage
      if (this.config.enableMemoryMonitoring) {
        const stats = wasmMemoryMonitor.getMemoryStats(this.serviceId)
        if (stats) {
          memoryUsed = stats.used
          memoryPeak = stats.peakUsage
        }
      }

      // Record metrics
      const processingTime = performance.now() - startTime
      this.recordMetrics({
        operation: 'format',
        inputSize,
        outputSize: result.formatted?.length || 0,
        processingTime,
        memoryUsed,
        memoryPeak,
        cacheHit,
        streamProcessed,
        objectsPooled: 0,
        efficiency: this.calculateEfficiency(
          inputSize,
          result.formatted?.length || 0,
          processingTime
        ),
      })

      return result
    } catch (error) {
      // Record deallocation on error
      if (this.config.enableMemoryOptimization) {
        wasmMemoryManager.recordDeallocation(this.serviceId, inputSize)
      }

      throw error
    }
  }

  /**
   * Validate JSON with memory optimization
   */
  async validate(
    jsonData: any,
    schema: any,
    options: Partial<JsonValidationOptions> = {}
  ): Promise<JsonValidationResult> {
    await this.ensureInitialized()

    const startTime = performance.now()
    let memoryUsed = 0
    let memoryPeak = 0
    let cacheHit = false

    try {
      // Check cache first
      if (this.cache) {
        const cacheKey = this.generateCacheKey(
          'validate',
          JSON.stringify(jsonData),
          schema,
          options
        )
        const cached = this.cache.get(cacheKey)
        if (cached) {
          cacheHit = true
          return cached
        }
      }

      const inputSize = JSON.stringify(jsonData).length

      // Check memory availability
      if (inputSize > this.config.maxInputSize) {
        throw new Error(`Input size exceeds maximum allowed size`)
      }

      // Record allocation
      if (this.config.enableMemoryOptimization) {
        wasmMemoryManager.recordAllocation(this.serviceId, inputSize)
      }

      const result = await this.validator.validate(jsonData, schema, options)

      // Cache the result
      if (this.cache && result.valid) {
        const cacheKey = this.generateCacheKey(
          'validate',
          JSON.stringify(jsonData),
          schema,
          options
        )
        this.cache.set(cacheKey, result)
      }

      // Record deallocation
      if (this.config.enableMemoryOptimization) {
        wasmMemoryManager.recordDeallocation(this.serviceId, inputSize)
      }

      // Get memory usage
      if (this.config.enableMemoryMonitoring) {
        const stats = wasmMemoryMonitor.getMemoryStats(this.serviceId)
        if (stats) {
          memoryUsed = stats.used
          memoryPeak = stats.peakUsage
        }
      }

      // Record metrics
      const processingTime = performance.now() - startTime
      this.recordMetrics({
        operation: 'validate',
        inputSize,
        outputSize: JSON.stringify(result).length,
        processingTime,
        memoryUsed,
        memoryPeak,
        cacheHit,
        streamProcessed: false,
        objectsPooled: 0,
        efficiency: this.calculateEfficiency(
          inputSize,
          JSON.stringify(result).length,
          processingTime
        ),
      })

      return result
    } catch (error) {
      if (this.config.enableMemoryOptimization) {
        const inputSize = JSON.stringify(jsonData).length
        wasmMemoryManager.recordDeallocation(this.serviceId, inputSize)
      }
      throw error
    }
  }

  /**
   * Convert JSON with memory optimization
   */
  async convert(
    jsonData: any,
    targetFormat: string,
    options: Partial<JsonConversionOptions> = {}
  ): Promise<JsonConversionResult> {
    await this.ensureInitialized()

    const startTime = performance.now()
    let memoryUsed = 0
    let memoryPeak = 0
    let cacheHit = false

    try {
      // Check cache first
      if (this.cache) {
        const cacheKey = this.generateCacheKey(
          'convert',
          JSON.stringify(jsonData),
          targetFormat,
          options
        )
        const cached = this.cache.get(cacheKey)
        if (cached) {
          cacheHit = true
          return cached
        }
      }

      const inputSize = JSON.stringify(jsonData).length

      // Check memory availability
      if (inputSize > this.config.maxInputSize) {
        throw new Error(`Input size exceeds maximum allowed size`)
      }

      // Record allocation
      if (this.config.enableMemoryOptimization) {
        wasmMemoryManager.recordAllocation(this.serviceId, inputSize)
      }

      const result = await this.converter.convert(jsonData, targetFormat, options)

      // Cache the result
      if (this.cache && result.success) {
        const cacheKey = this.generateCacheKey(
          'convert',
          JSON.stringify(jsonData),
          targetFormat,
          options
        )
        this.cache.set(cacheKey, result)
      }

      // Record deallocation
      if (this.config.enableMemoryOptimization) {
        const outputSize = JSON.stringify(result).length
        wasmMemoryManager.recordDeallocation(this.serviceId, inputSize + outputSize)
      }

      // Get memory usage
      if (this.config.enableMemoryMonitoring) {
        const stats = wasmMemoryMonitor.getMemoryStats(this.serviceId)
        if (stats) {
          memoryUsed = stats.used
          memoryPeak = stats.peakUsage
        }
      }

      // Record metrics
      const processingTime = performance.now() - startTime
      this.recordMetrics({
        operation: 'convert',
        inputSize,
        outputSize: JSON.stringify(result).length,
        processingTime,
        memoryUsed,
        memoryPeak,
        cacheHit,
        streamProcessed: false,
        objectsPooled: 0,
        efficiency: this.calculateEfficiency(
          inputSize,
          JSON.stringify(result).length,
          processingTime
        ),
      })

      return result
    } catch (error) {
      if (this.config.enableMemoryOptimization) {
        const inputSize = JSON.stringify(jsonData).length
        wasmMemoryManager.recordDeallocation(this.serviceId, inputSize)
      }
      throw error
    }
  }

  /**
   * Get memory statistics for the service
   */
  getMemoryStats(): JsonMemoryStats | null {
    if (!this.config.enableMemoryMonitoring) {
      return null
    }

    try {
      const report = getMemoryReport(this.serviceId)
      if (!report) {
        return null
      }

      return {
        serviceId: this.serviceId,
        formatterMemory: this.getEstimateFormatterMemory(),
        validatorMemory: this.getEstimateValidatorMemory(),
        converterMemory: this.getEstimateConverterMemory(),
        cacheMemory: this.cache ? this.cache.memoryUsage() : 0,
        totalMemory: report.management?.used || 0,
        peakMemory: report.monitoring?.peakUsage || 0,
        allocationCount: report.management?.totalAllocations || 0,
        deallocationCount: report.management?.totalDeallocations || 0,
        leakProbability: report.leakDetection?.leakProbability || 0,
        efficiency: report.monitoring?.efficiencyScore || 0,
        gcStats: {
          totalGCs: report.management?.gcStats?.totalGCs || 0,
          totalGCTime: report.management?.gcStats?.totalGCTime || 0,
          memoryReclaimed: report.management?.gcStats?.memoryReclaimed || 0,
        },
        timestamp: new Date(),
      }
    } catch (error) {
      console.error('Error getting memory stats:', error)
      return null
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): JsonPerformanceMetrics[] {
    return [...this.metrics]
  }

  /**
   * Clear performance metrics
   */
  clearMetrics(): void {
    this.metrics = []
  }

  /**
   * Check for memory leaks
   */
  async checkMemoryLeaks(): Promise<boolean> {
    if (!this.config.enableLeakDetection) {
      return false
    }

    try {
      const leakResult = memoryLeakDetector.detectLeaks(this.serviceId)
      return leakResult.hasLeak
    } catch (error) {
      console.error('Error checking memory leaks:', error)
      return false
    }
  }

  /**
   * Trigger garbage collection
   */
  async triggerGarbageCollection(aggressive = false): Promise<void> {
    if (!this.config.enableMemoryOptimization) {
      return
    }

    try {
      await wasmMemoryManager.triggerGC(this.serviceId, aggressive)
    } catch (error) {
      console.error('Error triggering garbage collection:', error)
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    if (this.cache) {
      this.cache.clear()
    }
  }

  /**
   * Dispose of the service
   */
  async dispose(): Promise<void> {
    if (!this.isInitialized) {
      return
    }

    try {
      // Clear cache
      this.clearCache()

      // Dispose underlying services
      await Promise.all([
        this.formatter.dispose(),
        this.validator.dispose(),
        this.converter.dispose(),
      ])

      // Cleanup memory optimization
      if (this.config.enableMemoryOptimization) {
        cleanupMemoryOptimization(this.serviceId)
      }

      // Clear metrics
      this.clearMetrics()

      // Remove from instances
      for (const [key, instance] of JsonOptimizer.instances) {
        if (instance === this) {
          JsonOptimizer.instances.delete(key)
          break
        }
      }

      this.isInitialized = false
    } catch (error) {
      console.error('Error disposing JSON optimizer:', error)
    }
  }

  /**
   * Initialize memory optimization
   */
  private async initializeMemoryOptimization(): Promise<void> {
    // Create a mock module for memory tracking
    const mockModule = {
      id: this.serviceId,
      name: 'JSON Optimizer',
      version: '1.0.0',
      description: 'Memory-optimized JSON service',
      category: 'json',
      authors: ['System'],
      dependencies: [],
      apiVersion: '1.0.0',
      isCompatible: async () => true,
      initialize: async () => {},
      isInitialized: () => true,
      getMetadata: () => ({
        id: this.serviceId,
        name: 'JSON Optimizer',
        version: '1.0.0',
        description: 'Memory-optimized JSON service',
        category: 'json',
        authors: ['System'],
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
      }),
      execute: async () => ({ success: true }),
      dispose: async () => {},
      getHealth: async () => ({
        status: 'healthy' as const,
        lastCheck: new Date(),
        responseTime: 0,
        memoryUsage: 0,
        errorRate: 0,
        uptime: 0,
      }),
    }

    initializeMemoryOptimization(mockModule, {
      enableMonitoring: this.config.enableMemoryMonitoring,
      enableLeakDetection: this.config.enableLeakDetection,
      enableMemoryManagement: true,
      memoryLimit: this.config.memoryLimit,
      customConfig: {
        gc: {
          strategy: this.config.gcStrategy as any,
        },
      },
    })
  }

  /**
   * Configure services with memory limits
   */
  private configureServices(): void {
    // Configure formatter
    this.formatter.setLimits(
      Math.floor(this.config.memoryLimit * 0.3),
      Math.floor(this.config.memoryLimit * 0.5)
    )

    // Configure validator
    this.validator.setLimits(
      Math.floor(this.config.memoryLimit * 0.3),
      Math.floor(this.config.memoryLimit * 0.5)
    )

    // Configure converter
    this.converter.setLimits(
      Math.floor(this.config.memoryLimit * 0.3),
      Math.floor(this.config.memoryLimit * 0.5)
    )
  }

  /**
   * Format JSON with streaming for large inputs
   */
  private async formatWithStreaming(
    jsonString: string,
    options: Partial<JsonFormattingOptions>
  ): Promise<JsonFormattingResult> {
    // Simple streaming implementation
    // In a real implementation, this would use actual streaming JSON parser
    const chunks = []
    const chunkSize = this.config.streamChunkSize

    for (let i = 0; i < jsonString.length; i += chunkSize) {
      const chunk = jsonString.slice(i, i + chunkSize)
      chunks.push(chunk)
    }

    // Rejoin and format (simplified)
    const rejoined = chunks.join('')
    return this.formatter.format(rejoined, options)
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(...args: any[]): string {
    const key = args
      .map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
      .join(':')
    return `json_opt_${key}`
  }

  /**
   * Calculate efficiency score
   */
  private calculateEfficiency(
    inputSize: number,
    outputSize: number,
    processingTime: number
  ): number {
    if (processingTime === 0) return 100

    // Simple efficiency calculation based on throughput
    const throughput = (inputSize + outputSize) / processingTime
    const maxThroughput = 1024 * 1024 // 1MB/ms as reference
    return Math.min(100, (throughput / maxThroughput) * 100)
  }

  /**
   * Record performance metrics
   */
  private recordMetrics(metrics: JsonPerformanceMetrics): void {
    this.metrics.push(metrics)

    // Limit metrics size
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.splice(0, this.metrics.length - this.maxMetrics)
    }
  }

  /**
   * Ensure service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }

  /**
   * Estimate formatter memory usage
   */
  private getEstimateFormatterMemory(): number {
    return 1024 * 1024 // 1MB estimate
  }

  /**
   * Estimate validator memory usage
   */
  private getEstimateValidatorMemory(): number {
    return 2 * 1024 * 1024 // 2MB estimate
  }

  /**
   * Estimate converter memory usage
   */
  private getEstimateConverterMemory(): number {
    return 1024 * 1024 // 1MB estimate
  }
}

// Export singleton instances
export const jsonOptimizer = JsonOptimizer.getInstance()

// Export utility functions
export async function formatJsonOptimized(
  jsonString: string,
  options?: Partial<JsonFormattingOptions>,
  config?: Partial<JsonServiceConfig>
): Promise<JsonFormattingResult> {
  const optimizer = JsonOptimizer.getInstance(config)
  return optimizer.format(jsonString, options)
}

export async function validateJsonOptimized(
  jsonData: any,
  schema: any,
  options?: Partial<JsonValidationOptions>,
  config?: Partial<JsonServiceConfig>
): Promise<JsonValidationResult> {
  const optimizer = JsonOptimizer.getInstance(config)
  return optimizer.validate(jsonData, schema, options)
}

export async function convertJsonOptimized(
  jsonData: any,
  targetFormat: string,
  options?: Partial<JsonConversionOptions>,
  config?: Partial<JsonServiceConfig>
): Promise<JsonConversionResult> {
  const optimizer = JsonOptimizer.getInstance(config)
  return optimizer.convert(jsonData, targetFormat, options)
}

export function getJsonMemoryStats(_serviceId?: string): JsonMemoryStats | null {
  const optimizer = JsonOptimizer.getInstance()
  return optimizer.getMemoryStats()
}

export async function checkJsonMemoryLeaks(_serviceId?: string): Promise<boolean> {
  const optimizer = JsonOptimizer.getInstance()
  return optimizer.checkMemoryLeaks()
}
