/**
 * 增强的代码格式化器
 * 使用优化的 WASM 模块和智能缓存策略
 */

import { logger } from '@shared/utils'
import { createMultiLayerCache } from '../cache/multi-layer-cache'
import {
  createWASMPerformanceOptimizer,
  type WASMPerformanceOptions,
} from './performance-optimizer'

export interface CodeFormatOptions {
  language: string
  indentSize?: number
  useTabs?: boolean
  semicolons?: boolean
  quotes?: 'single' | 'double'
  trailingCommas?: boolean
  lineWidth?: number
  enableFormatting?: boolean
  customRules?: Record<string, unknown>
}

export interface FormatResult {
  formatted: string
  original: string
  options: CodeFormatOptions
  metrics: {
    executionTime: number
    changes: number
    linesAdded: number
    linesRemoved: number
  }
  errors?: string[]
}

export interface LanguageConfig {
  name: string
  extensions: string[]
  wasmModule?: string // Module path or identifier
  defaultOptions: Partial<CodeFormatOptions>
  features: string[]
}

export class EnhancedCodeFormatter {
  private performanceOptimizer: ReturnType<typeof createWASMPerformanceOptimizer>
  private cache: ReturnType<typeof createMultiLayerCache>
  private languageConfigs: Map<string, LanguageConfig> = new Map()
  private formatStats: Map<string, { count: number; totalTime: number }> = new Map()

  constructor(
    kvCache: KVNamespace,
    d1Database: D1Database,
    private options: {
      cacheEnabled?: boolean
      performanceEnabled?: boolean
      wasmOptions?: WASMPerformanceOptions
    } = {}
  ) {
    this.performanceOptimizer = createWASMPerformanceOptimizer({
      enableMemoryOptimization: true,
      enableParallelProcessing: true,
      maxMemoryMB: 32,
      timeoutMs: 10000,
      enableProfiling: true,
      cacheCompiledModules: true,
      ...options.wasmOptions,
    })

    this.cache = createMultiLayerCache(kvCache, d1Database, {
      l1MaxSize: 50,
      l1MaxMemory: 5 * 1024 * 1024,
      cleanupInterval: 300000, // 5 minutes
    })

    this.initializeLanguageConfigs()
  }

  private initializeLanguageConfigs(): void {
    const configs: LanguageConfig[] = [
      {
        name: 'JavaScript',
        extensions: ['.js', '.jsx', '.mjs'],
        defaultOptions: {
          indentSize: 2,
          useTabs: false,
          semicolons: true,
          quotes: 'single',
          trailingCommas: true,
          lineWidth: 100,
        },
        features: ['formatting', 'linting', 'auto-fix'],
      },
      {
        name: 'TypeScript',
        extensions: ['.ts', '.tsx'],
        defaultOptions: {
          indentSize: 2,
          useTabs: false,
          semicolons: true,
          quotes: 'single',
          trailingCommas: true,
          lineWidth: 100,
        },
        features: ['formatting', 'type-checking', 'linting'],
      },
      {
        name: 'JSON',
        extensions: ['.json'],
        defaultOptions: {
          indentSize: 2,
          useTabs: false,
        },
        features: ['formatting', 'validation', 'minify'],
      },
      {
        name: 'Python',
        extensions: ['.py'],
        defaultOptions: {
          indentSize: 4,
          useTabs: false,
          lineWidth: 88,
        },
        features: ['formatting', 'import-sorting', 'linting'],
      },
    ]

    configs.forEach(config => {
      this.languageConfigs.set(config.name.toLowerCase(), config)
    })
  }

  async formatCode(code: string, options: CodeFormatOptions): Promise<FormatResult> {
    const startTime = performance.now()

    try {
      // 验证输入
      if (!code || typeof code !== 'string') {
        throw new Error('Invalid code input')
      }

      if (!options.language) {
        throw new Error('Language is required')
      }

      // 获取语言配置
      const languageConfig = this.languageConfigs.get(options.language.toLowerCase())
      if (!languageConfig) {
        throw new Error(`Unsupported language: ${options.language}`)
      }

      // 合并默认选项
      const mergedOptions = {
        ...languageConfig.defaultOptions,
        ...options,
        language: languageConfig.name,
      } as CodeFormatOptions

      // 生成缓存键
      const cacheKey = this.generateCacheKey(code, mergedOptions)

      // 尝试从缓存获取结果
      if (this.options.cacheEnabled) {
        const cached = await this.cache.get<FormatResult>(cacheKey)
        if (cached) {
          logger.debug('Code format cache hit', {
            language: mergedOptions.language,
            codeLength: code.length,
          })
          return cached
        }
      }

      // 执行格式化
      const result = await this.performFormatting(code, mergedOptions, languageConfig)

      // 更新统计信息
      this.updateStats(mergedOptions.language, performance.now() - startTime)

      // 缓存结果
      if (this.options.cacheEnabled) {
        await this.cache.set(cacheKey, result, {
          ttl: 3600000, // 1 hour
          tags: ['code-format', mergedOptions.language],
        })
      }

      logger.info('Code formatting completed', {
        language: mergedOptions.language,
        executionTime: result.metrics.executionTime,
        changes: result.metrics.changes,
      })

      return result
    } catch (error) {
      logger.error('Code formatting failed', {
        language: options.language,
        error: (error as Error).message,
        codeLength: code.length,
      })

      return {
        formatted: code,
        original: code,
        options,
        metrics: {
          executionTime: performance.now() - startTime,
          changes: 0,
          linesAdded: 0,
          linesRemoved: 0,
        },
        errors: [(error as Error).message],
      }
    }
  }

  async formatMultiple(
    codeFiles: Array<{ code: string; options: CodeFormatOptions }>,
    options: {
      parallel?: boolean
      maxConcurrency?: number
    } = {}
  ): Promise<FormatResult[]> {
    if (options.parallel !== false && this.options.performanceEnabled) {
      return this.performanceOptimizer.executeParallel(
        this.getFormatterWASM(),
        'formatBatch',
        [codeFiles],
        {
          maxConcurrency: options.maxConcurrency || 4,
        }
      )
    } else {
      // 顺序执行
      const results: FormatResult[] = []
      for (const file of codeFiles) {
        const result = await this.formatCode(file.code, file.options)
        results.push(result)
      }
      return results
    }
  }

  async validateCode(
    code: string,
    language: string
  ): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    try {
      const languageConfig = this.languageConfigs.get(language.toLowerCase())
      if (!languageConfig) {
        throw new Error(`Unsupported language: ${language}`)
      }

      // 使用 WASM 模块进行验证
      const wasmModule = await this.getFormatterWASM()

      const result = await this.performanceOptimizer.executeWithOptimization(
        wasmModule,
        'validate',
        [code, language],
        {
          timeout: 5000,
        }
      )

      return result as {
        valid: boolean
        errors: string[]
        warnings: string[]
      }
    } catch (error) {
      logger.error('Code validation failed', {
        language,
        error: (error as Error).message,
      })

      return {
        valid: false,
        errors: [(error as Error).message],
        warnings: [],
      }
    }
  }

  private async performFormatting(
    code: string,
    options: CodeFormatOptions,
    _languageConfig: LanguageConfig
  ): Promise<FormatResult> {
    if (!this.options.performanceEnabled) {
      // 使用简单的格式化逻辑（备用方案）
      return this.performSimpleFormatting(code, options)
    }

    try {
      const wasmModule = await this.getFormatterWASM()

      const result = await this.performanceOptimizer.executeWithOptimization(
        wasmModule,
        'format',
        [code, options],
        {
          timeout: 10000,
          enableParallel: false,
        }
      )

      const formatted = result as { formatted: string; changes: number }

      return {
        formatted: formatted.formatted,
        original: code,
        options,
        metrics: this.calculateMetrics(code, formatted.formatted),
        errors: formatted.changes === 0 ? ['No changes needed'] : undefined,
      }
    } catch (error) {
      logger.warn('WASM formatting failed, falling back to simple formatting', {
        language: options.language,
        error: (error as Error).message,
      })

      return this.performSimpleFormatting(code, options)
    }
  }

  private performSimpleFormatting(code: string, options: CodeFormatOptions): FormatResult {
    // 简单的格式化逻辑作为备用方案
    let formatted = code

    // 基本的格式化规则
    if (options.language === 'json') {
      try {
        const parsed = JSON.parse(code)
        formatted = JSON.stringify(parsed, null, options.indentSize || 2)
      } catch {
        // 如果解析失败，保持原样
        formatted = code
      }
    } else {
      // 基本的缩进处理
      const lines = code.split('\n')
      const indentChar = options.useTabs ? '\t' : ' '.repeat(options.indentSize || 2)

      formatted = lines
        .map(line => {
          if (line.trim() === '') return line

          // 简单的缩进逻辑
          const trimmed = line.trim()
          if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
            return (
              indentChar.repeat(
                Math.max(0, (line.match(/^\s*/)?.[0]?.length || 0) / (options.indentSize || 2) - 1)
              ) + trimmed
            )
          }

          return line
        })
        .join('\n')
    }

    return {
      formatted,
      original: code,
      options,
      metrics: this.calculateMetrics(code, formatted),
    }
  }

  private async getFormatterWASM(): Promise<ArrayBuffer> {
    // 这里应该返回实际的 WASM 模块
    // 为了演示，返回一个简单的占位符
    throw new Error('WASM formatter module not implemented')
  }

  private calculateMetrics(
    original: string,
    formatted: string
  ): {
    executionTime: number
    changes: number
    linesAdded: number
    linesRemoved: number
  } {
    const originalLines = original.split('\n')
    const formattedLines = formatted.split('\n')

    return {
      executionTime: 0, // 在实际实现中应该测量执行时间
      changes: original !== formatted ? 1 : 0,
      linesAdded: Math.max(0, formattedLines.length - originalLines.length),
      linesRemoved: Math.max(0, originalLines.length - formattedLines.length),
    }
  }

  private generateCacheKey(code: string, options: CodeFormatOptions): string {
    const keyData = {
      code: this.hashString(code),
      options: this.hashString(JSON.stringify(options)),
    }

    return `format:${this.hashString(JSON.stringify(keyData))}`
  }

  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }

  private updateStats(language: string, executionTime: number): void {
    const stats = this.formatStats.get(language) || { count: 0, totalTime: 0 }
    stats.count++
    stats.totalTime += executionTime
    this.formatStats.set(language, stats)
  }

  getStatistics(): {
    languages: Record<string, { count: number; averageTime: number }>
    cache: any
    performance: any
  } {
    const languages: Record<string, { count: number; averageTime: number }> = {}

    for (const [language, stats] of this.formatStats.entries()) {
      languages[language] = {
        count: stats.count,
        averageTime: stats.totalTime / stats.count,
      }
    }

    return {
      languages,
      cache: this.options.cacheEnabled ? this.cache.getStats() : null,
      performance: this.options.performanceEnabled ? this.performanceOptimizer.getMetrics() : null,
    }
  }

  getSupportedLanguages(): string[] {
    return Array.from(this.languageConfigs.keys())
  }

  getLanguageConfig(language: string): LanguageConfig | undefined {
    return this.languageConfigs.get(language.toLowerCase())
  }

  async clearCache(): Promise<void> {
    if (this.options.cacheEnabled) {
      await this.cache.clear()
    }

    if (this.options.performanceEnabled) {
      this.performanceOptimizer.clearCache()
    }

    this.formatStats.clear()

    logger.info('Code formatter cache cleared')
  }
}

// 工厂函数
export function createEnhancedCodeFormatter(
  kvCache: KVNamespace,
  d1Database: D1Database,
  options?: ConstructorParameters<typeof EnhancedCodeFormatter>[2]
): EnhancedCodeFormatter {
  return new EnhancedCodeFormatter(kvCache, d1Database, options)
}
