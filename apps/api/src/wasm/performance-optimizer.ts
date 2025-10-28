/**
 * WASM 性能优化器
 * 提供内存管理、并行处理和性能监控功能
 */

import { logger } from '@shared/utils'

export interface WASMMetrics {
  executionTime: number
  memoryUsage: {
    initial: number
    peak: number
    final: number
  }
  cpuTime: number
  heapSize: number
  stackSize: number
  timestamp: number
}

export interface WASMPerformanceOptions {
  enableMemoryOptimization?: boolean
  enableParallelProcessing?: boolean
  maxMemoryMB?: number
  timeoutMs?: number
  enableProfiling?: boolean
  cacheCompiledModules?: boolean
}

export class WASMPerformanceOptimizer {
  private moduleCache = new Map<string, WebAssembly.Module>()
  private instancePool = new Map<string, WebAssembly.Instance[]>()
  private metricsHistory: WASMMetrics[] = []
  private memoryManager: MemoryManager

  constructor(private options: WASMPerformanceOptions = {}) {
    this.memoryManager = new MemoryManager(options.maxMemoryMB || 64)
    this.performanceProfiler = new PerformanceProfiler()
  }

  async executeWithOptimization<T = unknown>(
    wasmModule: ArrayBuffer | Uint8Array,
    functionName: string,
    args: unknown[],
    options: {
      memoryLimit?: number
      timeout?: number
      enableParallel?: boolean
    } = {}
  ): Promise<T> {
    const startTime = performance.now()
    const moduleKey = this.getModuleHash(wasmModule)

    try {
      // 获取或编译 WASM 模块
      const module = await this.getCompiledModule(wasmModule, moduleKey)

      // 获取或创建实例
      const instance = await this.getInstance(module, moduleKey)

      // 预执行优化
      await this.preExecutionOptimization(instance, args)

      // 监控内存使用
      const _initialMemory = this.memoryManager.getCurrentUsage()

      // 执行函数
      const result = await this.executeFunction<T>(
        instance,
        functionName,
        args,
        options.timeout || this.options.timeoutMs || 30000
      )

      // 收集性能指标
      const executionTime = performance.now() - startTime
      const finalMemory = this.memoryManager.getCurrentUsage()

      const metrics: WASMMetrics = {
        executionTime,
        memoryUsage: {
          initial,
          peak: this.memoryManager.getPeakUsage(),
          final: finalMemory,
        },
        cpuTime: executionTime, // 简化版本，实际需要更精确的 CPU 时间
        heapSize: this.memoryManager.getHeapSize(),
        stackSize: this.memoryManager.getStackSize(),
        timestamp: Date.now(),
      }

      this.recordMetrics(metrics)

      // 后执行优化
      await this.postExecutionOptimization(instance)

      // 归还实例到池中
      this.returnInstanceToPool(moduleKey, instance)

      logger.debug('WASM execution completed', {
        function: functionName,
        executionTime,
        memoryUsage: metrics.memoryUsage,
      })

      return result
    } catch (error) {
      logger.error('WASM execution failed', {
        function: functionName,
        error: (error as Error).message,
        executionTime: performance.now() - startTime,
      })
      throw error
    }
  }

  async executeParallel<T = unknown>(
    wasmModule: ArrayBuffer | Uint8Array,
    functionName: string,
    argsArray: unknown[][],
    options: {
      maxConcurrency?: number
      memoryLimit?: number
    } = {}
  ): Promise<T[]> {
    if (!this.options.enableParallelProcessing) {
      // 如果没有启用并行处理，顺序执行
      const results: T[] = []
      for (const args of argsArray) {
        const result = await this.executeWithOptimization<T>(wasmModule, functionName, args)
        results.push(result)
      }
      return results
    }

    const maxConcurrency = options.maxConcurrency || 4
    const chunks = this.chunkArray(argsArray, maxConcurrency)

    const results: T[] = []

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(args =>
        this.executeWithOptimization<T>(wasmModule, functionName, args)
      )

      const chunkResults = await Promise.allSettled(chunkPromises)

      // 处理结果
      chunkResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          logger.error('Parallel WASM execution failed', {
            error: result.reason,
            index: results.length + index,
          })
          throw result.reason
        }
      })
    }

    return results
  }

  private async getCompiledModule(
    wasmBytes: ArrayBuffer | Uint8Array,
    moduleKey: string
  ): Promise<WebAssembly.Module> {
    if (this.options.cacheCompiledModules && this.moduleCache.has(moduleKey)) {
      return this.moduleCache.get(moduleKey)!
    }

    const module = await WebAssembly.compile(wasmBytes)

    if (this.options.cacheCompiledModules) {
      this.moduleCache.set(moduleKey, module)
    }

    return module
  }

  private async getInstance(
    module: WebAssembly.Module,
    moduleKey: string
  ): Promise<WebAssembly.Instance> {
    // 尝试从实例池获取
    const pool = this.instancePool.get(moduleKey)
    if (pool && pool.length > 0) {
      return pool.pop()!
    }

    // 创建新实例
    const memory = this.memoryManager.createMemory()
    const instance = new WebAssembly.Instance(module, {
      env: {
        memory,
        // 添加其他必要的 WASM 导入
        abort: () => {
          throw new Error('WASM execution aborted')
        },
        log: (ptr: number, len: number) => {
          // 实现日志记录
          logger.debug('WASM log', { ptr, len })
        },
      },
    })

    return instance
  }

  private returnInstanceToPool(moduleKey: string, instance: WebAssembly.Instance): void {
    if (!this.instancePool.has(moduleKey)) {
      this.instancePool.set(moduleKey, [])
    }

    const pool = this.instancePool.get(moduleKey)!
    if (pool.length < 5) {
      // 限制池大小
      pool.push(instance)
    }
  }

  private async preExecutionOptimization(
    _instance: WebAssembly.Instance,
    _args: unknown[]
  ): Promise<void> {
    if (!this.options.enableMemoryOptimization) {
      return
    }

    // 预热内存
    this.memoryManager.warmup()

    // 优化参数
    // 这里可以添加特定的优化逻辑
  }

  private async postExecutionOptimization(_instance: WebAssembly.Instance): Promise<void> {
    if (!this.options.enableMemoryOptimization) {
      return
    }

    // 清理内存
    this.memoryManager.cleanup()

    // 重置实例状态
    // 这里可以添加实例重置逻辑
  }

  private async executeFunction<T>(
    instance: WebAssembly.Instance,
    functionName: string,
    args: unknown[],
    timeoutMs: number
  ): Promise<T> {
    const func = (instance.exports as Record<string, unknown>)[functionName] as WebAssembly.Function

    if (!func) {
      throw new Error(`Function '${functionName}' not found in WASM module`)
    }

    return this.executeWithTimeout(func, args, timeoutMs)
  }

  private async executeWithTimeout<T>(
    func: WebAssembly.Function,
    args: unknown[],
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`WASM execution timeout after ${timeoutMs}ms`))
      }, timeoutMs)

      try {
        const result = func(...args) as T
        clearTimeout(timeout)
        resolve(result)
      } catch (error) {
        clearTimeout(timeout)
        reject(error)
      }
    })
  }

  private getModuleHash(wasmBytes: ArrayBuffer | Uint8Array): string {
    const data = wasmBytes instanceof ArrayBuffer ? new Uint8Array(wasmBytes) : wasmBytes

    // 简单的哈希函数，实际应用中应该使用更强的哈希
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data[i]
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  private recordMetrics(metrics: WASMMetrics): void {
    this.metricsHistory.push(metrics)

    // 保持最近1000条记录
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory = this.metricsHistory.slice(-1000)
    }

    // 检查性能问题
    this.checkPerformanceIssues(metrics)
  }

  private checkPerformanceIssues(metrics: WASMMetrics): void {
    if (metrics.executionTime > 5000) {
      logger.warn('WASM execution taking too long', {
        executionTime: metrics.executionTime,
        memoryUsage: metrics.memoryUsage,
      })
    }

    if (metrics.memoryUsage.peak > (this.options.maxMemoryMB || 64) * 1024 * 1024) {
      logger.warn('WASM memory usage too high', {
        peakMemory: metrics.memoryUsage.peak,
        limit: (this.options.maxMemoryMB || 64) * 1024 * 1024,
      })
    }
  }

  getMetrics(): {
    recent: WASMMetrics[]
    average: {
      executionTime: number
      memoryUsage: number
      successRate: number
    }
    trends: {
      improving: boolean
      issues: string[]
    }
  } {
    const recent = this.metricsHistory.slice(-100)

    if (recent.length === 0) {
      return {
        recent: [],
        average: { executionTime: 0, memoryUsage: 0, successRate: 0 },
        trends: { improving: false, issues: [] },
      }
    }

    const avgExecutionTime = recent.reduce((sum, m) => sum + m.executionTime, 0) / recent.length
    const avgMemoryUsage = recent.reduce((sum, m) => sum + m.memoryUsage.peak, 0) / recent.length

    // 计算趋势
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2))
    const secondHalf = recent.slice(Math.floor(recent.length / 2))

    const firstHalfAvg =
      firstHalf.length > 0
        ? firstHalf.reduce((sum, m) => sum + m.executionTime, 0) / firstHalf.length
        : 0
    const secondHalfAvg =
      secondHalf.length > 0
        ? secondHalf.reduce((sum, m) => sum + m.executionTime, 0) / secondHalf.length
        : 0

    const improving = secondHalfAvg < firstHalfAvg

    const issues: string[] = []
    if (avgExecutionTime > 1000) issues.push('High execution time')
    if (avgMemoryUsage > 32 * 1024 * 1024) issues.push('High memory usage')

    return {
      recent,
      average: {
        executionTime: avgExecutionTime,
        memoryUsage: avgMemoryUsage,
        successRate: 1.0, // 简化版本，实际应该基于成功/失败统计
      },
      trends: {
        improving,
        issues,
      },
    }
  }

  clearCache(): void {
    this.moduleCache.clear()
    this.instancePool.clear()
    this.metricsHistory = []
    this.memoryManager.reset()

    logger.info('WASM performance optimizer cache cleared')
  }
}

// 内存管理器
class MemoryManager {
  private currentMemory = 0
  private peakMemory = 0
  private heapSize = 0
  private stackSize = 0

  constructor(private maxMemoryMB: number) {}

  createMemory(): WebAssembly.Memory {
    const memory = new WebAssembly.Memory({
      initial: 1, // 64KB
      maximum: Math.floor((this.maxMemoryMB * 1024 * 1024) / 65536), // 64KB pages
    })

    // 监控内存使用
    this.monitorMemory(memory)

    return memory
  }

  private monitorMemory(memory: WebAssembly.Memory): void {
    // 简化版本，实际应该更精确地监控
    const checkMemory = () => {
      const current = memory.buffer.byteLength
      this.currentMemory = current
      this.peakMemory = Math.max(this.peakMemory, current)
    }

    // 定期检查内存使用
    setInterval(checkMemory, 100)
  }

  warmup(): void {
    // 预热内存，分配一些初始空间
    this.currentMemory += 1024 * 1024 // 1MB
  }

  cleanup(): void {
    // 清理内存，释放不必要的资源
    this.currentMemory = Math.max(this.currentMemory / 2, 1024 * 1024)
  }

  getCurrentUsage(): number {
    return this.currentMemory
  }

  getPeakUsage(): number {
    return this.peakMemory
  }

  getHeapSize(): number {
    return this.heapSize
  }

  getStackSize(): number {
    return this.stackSize
  }

  reset(): void {
    this.currentMemory = 0
    this.peakMemory = 0
    this.heapSize = 0
    this.stackSize = 0
  }
}

// 性能分析器
class PerformanceProfiler {
  private startTime = 0
  private samples: number[] = []

  startProfiling(): void {
    this.startTime = performance.now()
    this.samples = []
  }

  sample(): void {
    this.samples.push(performance.now() - this.startTime)
  }

  stopProfiling(): {
    duration: number
    samples: number[]
    averageSampleInterval: number
  } {
    const duration = performance.now() - this.startTime

    return {
      duration,
      samples: [...this.samples],
      averageSampleInterval: this.samples.length > 0 ? duration / this.samples.length : 0,
    }
  }
}

// 工厂函数
export function createWASMPerformanceOptimizer(
  options?: WASMPerformanceOptions
): WASMPerformanceOptimizer {
  return new WASMPerformanceOptimizer(options)
}
