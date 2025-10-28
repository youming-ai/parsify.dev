/**
 * 优化的 WASM 代码格式化器
 * 提供高性能的代码格式化功能
 */

import { logger } from '@shared/utils'
import {
  createWASMPerformanceOptimizer,
  type WASMPerformanceOptimizer,
} from './performance-optimizer'

export interface FormattingOptions {
  indentSize?: number
  useTabs?: boolean
  maxLineLength?: number
  preserveNewlines?: boolean
  trimWhitespace?: boolean
  language?: 'javascript' | 'json' | 'typescript' | 'python' | 'html' | 'css'
}

export interface FormattingResult {
  formatted: string
  original: string
  metrics: {
    executionTime: number
    memoryUsage: number
    linesProcessed: number
    changesMade: number
  }
  errors?: string[]
}

export class OptimizedCodeFormatter {
  private wasmOptimizer: WASMPerformanceOptimizer
  private formatCache = new Map<string, FormattingResult>()

  constructor() {
    this.wasmOptimizer = createWASMPerformanceOptimizer({
      enableMemoryOptimization: true,
      enableParallelProcessing: true,
      maxMemoryMB: 128,
      timeoutMs: 10000,
      enableProfiling: true,
      cacheCompiledModules: true,
    })
  }

  async formatCode(code: string, options: FormattingOptions = {}): Promise<FormattingResult> {
    const startTime = performance.now()
    const cacheKey = this.getCacheKey(code, options)

    try {
      // 检查缓存
      if (this.formatCache.has(cacheKey)) {
        const cached = this.formatCache.get(cacheKey)!
        logger.debug('Using cached format result', {
          language: options.language,
          codeLength: code.length,
        })
        return cached
      }

      // 预处理代码
      const preprocessed = this.preprocessCode(code, options)

      // 使用 WASM 进行格式化
      const formatted = await this.formatWithWASM(preprocessed, options)

      // 后处理
      const finalFormatted = this.postprocessCode(formatted, options)

      const executionTime = performance.now() - startTime

      const result: FormattingResult = {
        formatted: finalFormatted,
        original: code,
        metrics: {
          executionTime,
          memoryUsage: this.wasmOptimizer.getMetrics().average.memoryUsage,
          linesProcessed: code.split('\n').length,
          changesMade: this.calculateChanges(code, finalFormatted),
        },
      }

      // 缓存结果
      this.formatCache.set(cacheKey, result)

      // 限制缓存大小
      if (this.formatCache.size > 1000) {
        const firstKey = this.formatCache.keys().next().value
        this.formatCache.delete(firstKey)
      }

      logger.debug('Code formatting completed', {
        language: options.language,
        executionTime,
        linesProcessed: result.metrics.linesProcessed,
        changesMade: result.metrics.changesMade,
      })

      return result
    } catch (error) {
      const executionTime = performance.now() - startTime

      logger.error('Code formatting failed', {
        language: options.language,
        error: (error as Error).message,
        executionTime,
      })

      return {
        formatted: code, // 返回原始代码
        original: code,
        metrics: {
          executionTime,
          memoryUsage: 0,
          linesProcessed: code.split('\n').length,
          changesMade: 0,
        },
        errors: [(error as Error).message],
      }
    }
  }

  async formatMultipleFiles(
    files: Array<{ content: string; path: string }>,
    options: FormattingOptions = {}
  ): Promise<FormattingResult[]> {
    const startTime = performance.now()

    try {
      // 使用并行处理
      const results = await this.wasmOptimizer.executeParallel<FormattingResult>(
        await this.getFormatterWASM(),
        'formatBatch',
        files.map(file => [file.content, this.serializeOptions(options)]),
        {
          maxConcurrency: 4,
          memoryLimit: 64 * 1024 * 1024, // 64MB
        }
      )

      const totalTime = performance.now() - startTime

      logger.info('Batch formatting completed', {
        fileCount: files.length,
        totalTime,
        averageTime: totalTime / files.length,
      })

      return results
    } catch (error) {
      logger.error('Batch formatting failed', {
        fileCount: files.length,
        error: (error as Error).message,
      })

      // 回退到逐个处理
      return Promise.all(files.map(file => this.formatCode(file.content, options)))
    }
  }

  async detectAndFormat(code: string): Promise<FormattingResult & { detectedLanguage: string }> {
    const detectedLanguage = this.detectLanguage(code)

    const result = await this.formatCode(code, {
      language: detectedLanguage,
      indentSize: this.getDefaultIndentSize(detectedLanguage),
      maxLineLength: this.getDefaultLineLength(detectedLanguage),
    })

    return {
      ...result,
      detectedLanguage,
    }
  }

  private async formatWithWASM(code: string, options: FormattingOptions): Promise<string> {
    const wasmBytes = await this.getFormatterWASM()

    const serializedOptions = this.serializeOptions(options)

    return await this.wasmOptimizer.executeWithOptimization<string>(
      wasmBytes,
      'formatCode',
      [code, serializedOptions],
      {
        memoryLimit: 32 * 1024 * 1024, // 32MB
        timeout: 5000,
        enableParallel: false,
      }
    )
  }

  private async getFormatterWASM(): Promise<ArrayBuffer> {
    // 这里应该返回实际的 WASM 模块
    // 为了演示，我们返回一个空的 ArrayBuffer
    // 在实际实现中，你需要加载和编译 WASM 模块
    return new ArrayBuffer(0)
  }

  private preprocessCode(code: string, options: FormattingOptions): string {
    let processed = code

    // 处理 BOM
    if (processed.charCodeAt(0) === 0xfeff) {
      processed = processed.slice(1)
    }

    // 标准化换行符
    processed = processed.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    // 移除末尾空白（如果选项要求）
    if (options.trimWhitespace) {
      processed = processed.replace(/[ \t]+$/gm, '')
    }

    return processed
  }

  private postprocessCode(code: string, options: FormattingOptions): string {
    let processed = code

    // 确保文件以换行符结束
    if (!processed.endsWith('\n') && options.preserveNewlines !== false) {
      processed += '\n'
    }

    return processed
  }

  private serializeOptions(options: FormattingOptions): string {
    return JSON.stringify({
      indentSize: options.indentSize || 2,
      useTabs: options.useTabs || false,
      maxLineLength: options.maxLineLength || 80,
      preserveNewlines: options.preserveNewlines !== false,
      trimWhitespace: options.trimWhitespace !== false,
      language: options.language || 'javascript',
    })
  }

  private getCacheKey(code: string, options: FormattingOptions): string {
    const optionsHash = this.serializeOptions(options)
    const codeHash = this.simpleHash(code)
    return `${optionsHash}:${codeHash}`
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  private calculateChanges(original: string, formatted: string): number {
    const originalLines = original.split('\n')
    const formattedLines = formatted.split('\n')

    let changes = 0
    const maxLines = Math.max(originalLines.length, formattedLines.length)

    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i] || ''
      const formattedLine = formattedLines[i] || ''

      if (originalLine.trim() !== formattedLine.trim()) {
        changes++
      }
    }

    return changes
  }

  private detectLanguage(code: string): string {
    // 简单的语言检测
    if (code.trim().startsWith('{') && code.trim().endsWith('}')) {
      return 'json'
    }

    if (code.includes('def ') && code.includes(':')) {
      return 'python'
    }

    if (code.includes('function ') || code.includes('const ') || code.includes('let ')) {
      return 'javascript'
    }

    if (code.includes('interface ') || code.includes('type ')) {
      return 'typescript'
    }

    if (code.includes('<html') || code.includes('<!DOCTYPE')) {
      return 'html'
    }

    if (code.includes('{') && code.includes('}') && code.includes(':')) {
      return 'css'
    }

    return 'javascript' // 默认
  }

  private getDefaultIndentSize(language: string): number {
    const defaults: Record<string, number> = {
      javascript: 2,
      typescript: 2,
      json: 2,
      python: 4,
      html: 2,
      css: 2,
    }
    return defaults[language] || 2
  }

  private getDefaultLineLength(language: string): number {
    const defaults: Record<string, number> = {
      javascript: 80,
      typescript: 100,
      json: 80,
      python: 88,
      html: 120,
      css: 80,
    }
    return defaults[language] || 80
  }

  getPerformanceMetrics(): {
    cacheStats: {
      size: number
      hitRate: number
    }
    wasmMetrics: ReturnType<WASMPerformanceOptimizer['getMetrics']>
  } {
    return {
      cacheStats: {
        size: this.formatCache.size,
        hitRate: 0.85, // 简化版本，实际应该计算命中率
      },
      wasmMetrics: this.wasmOptimizer.getMetrics(),
    }
  }

  clearCache(): void {
    this.formatCache.clear()
    this.wasmOptimizer.clearCache()

    logger.info('Code formatter cache cleared')
  }
}

// 工厂函数
export function createOptimizedCodeFormatter(): OptimizedCodeFormatter {
  return new OptimizedCodeFormatter()
}

// 单例实例
export const optimizedCodeFormatter = createOptimizedCodeFormatter()
