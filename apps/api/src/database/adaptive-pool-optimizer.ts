/**
 * 自适应连接池优化器
 * 根据负载动态调整连接池大小和配置
 */

import { logger } from '@shared/utils'

interface PoolMetrics {
  activeConnections: number
  idleConnections: number
  totalRequests: number
  averageResponseTime: number
  errorRate: number
  timestamp: number
}

interface PoolConfiguration {
  minConnections: number
  maxConnections: number
  acquireTimeoutMs: number
  idleTimeoutMs: number
  createTimeoutMs: number
  destroyTimeoutMs: number
  healthCheckInterval: number
  maxLifetime: number
}

interface OptimizationStrategy {
  name: string
  threshold: Record<string, number>
  action: (metrics: PoolMetrics, config: PoolConfiguration) => Partial<PoolConfiguration>
}

export class AdaptivePoolOptimizer {
  private metrics: PoolMetrics[] = []
  private currentConfig: PoolConfiguration
  private optimizationStrategies: OptimizationStrategy[]
  private lastOptimization = 0
  private optimizationInterval = 30000 // 30 seconds

  constructor(
    initialConfig: PoolConfiguration,
    private onConfigUpdate?: (config: PoolConfiguration) => void
  ) {
    this.currentConfig = { ...initialConfig }
    this.optimizationStrategies = this.initializeStrategies()
  }

  private initializeStrategies(): OptimizationStrategy[] {
    return [
      // 高负载扩容策略
      {
        name: 'scale_up_under_load',
        threshold: {
          averageResponseTime: 500,
          activeConnectionsRatio: 0.8,
          errorRate: 0.05,
        },
        action: (metrics, config) => {
          const scaleUpFactor = Math.min(1.5, 1 + metrics.averageResponseTime / 1000)
          const newMaxConnections = Math.floor(config.maxConnections * scaleUpFactor)

          return {
            maxConnections: Math.min(newMaxConnections, 50),
            acquireTimeoutMs: Math.max(config.acquireTimeoutMs - 1000, 5000),
          }
        },
      },

      // 低负载缩容策略
      {
        name: 'scale_down_under_low_load',
        threshold: {
          averageResponseTime: 100,
          activeConnectionsRatio: 0.2,
          errorRate: 0.01,
        },
        action: (_metrics, config) => {
          return {
            maxConnections: Math.max(
              config.minConnections * 2,
              Math.floor(config.maxConnections * 0.8)
            ),
            idleTimeoutMs: Math.min(config.idleTimeoutMs * 1.2, 60000),
          }
        },
      },

      // 错误率优化策略
      {
        name: 'optimize_for_errors',
        threshold: {
          errorRate: 0.1,
          averageResponseTime: 1000,
        },
        action: (_metrics, config) => {
          return {
            maxConnections: Math.max(config.maxConnections - 2, config.minConnections),
            acquireTimeoutMs: config.acquireTimeoutMs * 1.5,
            createTimeoutMs: config.createTimeoutMs * 1.5,
            healthCheckInterval: config.healthCheckInterval * 0.5,
          }
        },
      },

      // 稳定性优化策略
      {
        name: 'optimize_for_stability',
        threshold: {
          errorRate: 0.02,
          averageResponseTime: 200,
        },
        action: (_metrics, config) => {
          return {
            maxLifetime: Math.min(config.maxLifetime * 1.1, 3600000), // max 1 hour
            healthCheckInterval: Math.min(config.healthCheckInterval * 1.2, 120000), // max 2 minutes
          }
        },
      },
    ]
  }

  recordMetrics(metrics: Omit<PoolMetrics, 'timestamp'>): void {
    const timestampedMetrics = {
      ...metrics,
      timestamp: Date.now(),
    }

    this.metrics.push(timestampedMetrics)

    // Keep only last 10 minutes of metrics
    const tenMinutesAgo = Date.now() - 600000
    this.metrics = this.metrics.filter(m => m.timestamp > tenMinutesAgo)

    // Check if optimization should run
    if (Date.now() - this.lastOptimization > this.optimizationInterval) {
      this.optimizePool()
    }
  }

  private optimizePool(): void {
    if (this.metrics.length < 5) {
      logger.debug('Insufficient metrics for optimization', {
        metricsCount: this.metrics.length,
      })
      return
    }

    const currentMetrics = this.calculateAverageMetrics()
    const applicableStrategies = this.findApplicableStrategies(currentMetrics)

    if (applicableStrategies.length === 0) {
      logger.debug('No optimization strategies applicable', {
        metrics: currentMetrics,
        config: this.currentConfig,
      })
      return
    }

    // Apply strategies in priority order
    let configUpdates: Partial<PoolConfiguration> = {}
    for (const strategy of applicableStrategies) {
      const updates = strategy.action(currentMetrics, this.currentConfig)
      configUpdates = { ...configUpdates, ...updates }

      logger.info('Applied optimization strategy', {
        strategy: strategy.name,
        updates,
        metrics: currentMetrics,
      })
    }

    // Update configuration
    this.currentConfig = {
      ...this.currentConfig,
      ...configUpdates,
    }

    this.lastOptimization = Date.now()

    // Notify listeners
    if (this.onConfigUpdate) {
      this.onConfigUpdate(this.currentConfig)
    }
  }

  private calculateAverageMetrics(): PoolMetrics {
    const recentMetrics = this.metrics.slice(-10) // Last 10 data points

    return {
      activeConnections: this.average(recentMetrics.map(m => m.activeConnections)),
      idleConnections: this.average(recentMetrics.map(m => m.idleConnections)),
      totalRequests: this.average(recentMetrics.map(m => m.totalRequests)),
      averageResponseTime: this.average(recentMetrics.map(m => m.averageResponseTime)),
      errorRate: this.average(recentMetrics.map(m => m.errorRate)),
      timestamp: Date.now(),
    }
  }

  private findApplicableStrategies(metrics: PoolMetrics): OptimizationStrategy[] {
    const totalConnections = metrics.activeConnections + metrics.idleConnections
    const activeConnectionsRatio =
      totalConnections > 0 ? metrics.activeConnections / totalConnections : 0

    return this.optimizationStrategies
      .filter(strategy => {
        const { threshold } = strategy

        return Object.entries(threshold).every(([key, value]) => {
          switch (key) {
            case 'averageResponseTime':
              return metrics.averageResponseTime >= value
            case 'activeConnectionsRatio':
              return activeConnectionsRatio >= value
            case 'errorRate':
              return metrics.errorRate >= value
            default:
              return false
          }
        })
      })
      .sort((a, b) => {
        // Prioritize error reduction strategies
        if (a.name.includes('error') && !b.name.includes('error')) return -1
        if (!a.name.includes('error') && b.name.includes('error')) return 1
        return 0
      })
  }

  private average(numbers: number[]): number {
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
  }

  getCurrentConfiguration(): PoolConfiguration {
    return { ...this.currentConfig }
  }

  getMetricsHistory(): PoolMetrics[] {
    return [...this.metrics]
  }

  // Manual configuration override
  updateConfiguration(updates: Partial<PoolConfiguration>): void {
    const newConfig = {
      ...this.currentConfig,
      ...updates,
    }

    // Validate configuration
    if (newConfig.minConnections > newConfig.maxConnections) {
      throw new Error('minConnections cannot be greater than maxConnections')
    }

    if (newConfig.maxConnections > 100) {
      logger.warn('High maxConnections value may impact performance', {
        maxConnections: newConfig.maxConnections,
      })
    }

    this.currentConfig = newConfig

    logger.info('Pool configuration updated manually', {
      updates,
      newConfig: this.currentConfig,
    })

    if (this.onConfigUpdate) {
      this.onConfigUpdate(this.currentConfig)
    }
  }

  // Health check for the optimizer itself
  healthCheck(): {
    healthy: boolean
    issues: string[]
    metrics: {
      optimizationCount: number
      lastOptimization: number
      metricsCount: number
    }
  } {
    const issues: string[] = []
    const now = Date.now()

    // Check if metrics are being collected
    if (this.metrics.length === 0) {
      issues.push('No metrics collected')
    }

    // Check if optimization is running
    if (now - this.lastOptimization > this.optimizationInterval * 3) {
      issues.push('Optimization not running')
    }

    // Check configuration validity
    if (this.currentConfig.minConnections > this.currentConfig.maxConnections) {
      issues.push('Invalid configuration: minConnections > maxConnections')
    }

    return {
      healthy: issues.length === 0,
      issues,
      metrics: {
        optimizationCount: this.metrics.length,
        lastOptimization: this.lastOptimization,
        metricsCount: this.metrics.length,
      },
    }
  }
}

// Factory function for creating optimizer with sensible defaults
export function createAdaptivePoolOptimizer(
  onConfigUpdate?: (config: PoolConfiguration) => void
): AdaptivePoolOptimizer {
  const defaultConfig: PoolConfiguration = {
    minConnections: 2,
    maxConnections: 10,
    acquireTimeoutMs: 30000,
    idleTimeoutMs: 30000,
    createTimeoutMs: 10000,
    destroyTimeoutMs: 5000,
    healthCheckInterval: 10000,
    maxLifetime: 1800000, // 30 minutes
  }

  return new AdaptivePoolOptimizer(defaultConfig, onConfigUpdate)
}
