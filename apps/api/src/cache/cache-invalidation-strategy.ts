/**
 * 智能缓存失效策略
 * 支持多种失效模式：TTL、事件驱动、依赖追踪等
 */

import { logger } from '@shared/utils'

export type InvalidationTrigger =
  | 'time_based'
  | 'event_based'
  | 'dependency_based'
  | 'usage_based'
  | 'manual'

export interface CacheDependency {
  key: string
  dependentKeys: string[]
  invalidationRules: InvalidationRule[]
}

export interface InvalidationRule {
  trigger: InvalidationTrigger
  condition?: (data: unknown, metadata?: Record<string, unknown>) => boolean
  delay?: number
  cascade?: boolean
}

export interface CacheEvent {
  type: 'update' | 'delete' | 'invalidate'
  key: string
  timestamp: number
  data?: unknown
  metadata?: Record<string, unknown>
}

export class CacheInvalidationStrategy {
  private dependencies = new Map<string, CacheDependency>()
  private eventQueue: CacheEvent[] = []
  private processingEvents = false
  private invalidationHistory = new Map<string, number>()

  constructor(
    private cache: {
      get: (key: string) => Promise<unknown | null>
      delete: (key: string) => Promise<boolean>
      clear: () => Promise<void>
    },
    private options: {
      maxEventQueueSize?: number
      batchSize?: number
      processingDelay?: number
      historyRetention?: number
    } = {}
  ) {
    // Start event processor
    this.startEventProcessor()
  }

  // Register cache dependencies
  registerDependency(dependency: CacheDependency): void {
    this.dependencies.set(dependency.key, dependency)

    logger.debug('Cache dependency registered', {
      key: dependency.key,
      dependentKeys: dependency.dependentKeys.length,
      rules: dependency.invalidationRules.length,
    })
  }

  // Trigger invalidation event
  async invalidate(key: string, trigger: InvalidationTrigger = 'manual'): Promise<void> {
    const event: CacheEvent = {
      type: 'invalidate',
      key,
      timestamp: Date.now(),
      metadata: { trigger },
    }

    this.addEvent(event)
  }

  // Trigger cache update event
  async update(key: string, data: unknown, metadata?: Record<string, unknown>): Promise<void> {
    const event: CacheEvent = {
      type: 'update',
      key,
      timestamp: Date.now(),
      data,
      metadata,
    }

    this.addEvent(event)
  }

  // Trigger cache delete event
  async delete(key: string): Promise<void> {
    const event: CacheEvent = {
      type: 'delete',
      key,
      timestamp: Date.now(),
    }

    this.addEvent(event)
  }

  // Schedule time-based invalidation
  scheduleInvalidation(key: string, delay: number): void {
    setTimeout(() => {
      this.invalidate(key, 'time_based')
    }, delay)

    logger.debug('Scheduled time-based invalidation', { key, delay })
  }

  // Invalidate by tags
  async invalidateByTag(tag: string): Promise<void> {
    const keysToInvalidate: string[] = []

    // Find all cache entries with the specified tag
    for (const [key, dependency] of this.dependencies.entries()) {
      const hasTag = dependency.invalidationRules.some(
        rule => rule.trigger === 'event_based' && dependency.dependentKeys.includes(tag)
      )

      if (hasTag) {
        keysToInvalidate.push(key)
      }
    }

    // Batch invalidate
    const invalidationPromises = keysToInvalidate.map(key => this.invalidate(key, 'event_based'))

    await Promise.allSettled(invalidationPromises)

    logger.info('Invalidated cache entries by tag', {
      tag,
      count: keysToInvalidate.length,
    })
  }

  // Get invalidation statistics
  getInvalidationStats(): {
    totalInvalidations: number
    invalidationsByTrigger: Record<InvalidationTrigger, number>
    invalidationsByHour: Record<string, number>
    recentInvalidations: Array<{ key: string; trigger: InvalidationTrigger; timestamp: number }>
  } {
    const now = Date.now()
    const oneHourAgo = now - 3600000
    const twentyFourHoursAgo = now - 86400000

    const stats = {
      totalInvalidations: this.invalidationHistory.size,
      invalidationsByTrigger: {} as Record<InvalidationTrigger, number>,
      invalidationsByHour: {} as Record<string, number>,
      recentInvalidations: [] as Array<{
        key: string
        trigger: InvalidationTrigger
        timestamp: number
      }>,
    }

    // Initialize counters
    const triggers: InvalidationTrigger[] = [
      'time_based',
      'event_based',
      'dependency_based',
      'usage_based',
      'manual',
    ]
    triggers.forEach(trigger => {
      stats.invalidationsByTrigger[trigger] = 0
    })

    // Process history
    for (const [key, timestamp] of this.invalidationHistory.entries()) {
      const age = now - timestamp

      if (age < oneHourAgo) {
        const hour = new Date(timestamp).getHours()
        stats.invalidationsByHour[hour.toString()] =
          (stats.invalidationsByHour[hour.toString()] || 0) + 1
      }

      if (age < twentyFourHoursAgo) {
        // Extract trigger from key format (key:trigger:timestamp)
        const keyParts = key.split(':')
        if (keyParts.length >= 2) {
          const trigger = keyParts[1] as InvalidationTrigger
          if (triggers.includes(trigger)) {
            stats.invalidationsByTrigger[trigger]++

            if (stats.recentInvalidations.length < 100) {
              stats.recentInvalidations.push({
                key: keyParts[0],
                trigger,
                timestamp,
              })
            }
          }
        }
      }
    }

    return stats
  }

  // Private methods
  private addEvent(event: CacheEvent): void {
    const maxQueueSize = this.options.maxEventQueueSize || 1000

    if (this.eventQueue.length >= maxQueueSize) {
      // Remove oldest events if queue is full
      this.eventQueue.shift()
      logger.warn('Event queue full, dropped oldest event')
    }

    this.eventQueue.push(event)
  }

  private startEventProcessor(): void {
    setInterval(async () => {
      if (!this.processingEvents && this.eventQueue.length > 0) {
        await this.processEvents()
      }
    }, this.options.processingDelay || 100)
  }

  private async processEvents(): Promise<void> {
    if (this.processingEvents) return

    this.processingEvents = true
    const batchSize = this.options.batchSize || 10

    try {
      const batch = this.eventQueue.splice(0, batchSize)

      for (const event of batch) {
        await this.processEvent(event)
      }

      if (batch.length > 0) {
        logger.debug('Processed cache events', { count: batch.length })
      }
    } catch (error) {
      logger.error('Error processing cache events', {
        error: (error as Error).message,
      })
    } finally {
      this.processingEvents = false
    }
  }

  private async processEvent(event: CacheEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'invalidate':
          await this.handleInvalidation(event)
          break
        case 'update':
          await this.handleUpdate(event)
          break
        case 'delete':
          await this.handleDelete(event)
          break
      }
    } catch (error) {
      logger.error('Error processing cache event', {
        event: event.type,
        key: event.key,
        error: (error as Error).message,
      })
    }
  }

  private async handleInvalidation(event: CacheEvent): Promise<void> {
    const { key } = event
    const trigger = (event.metadata?.trigger as InvalidationTrigger) || 'manual'

    // Record invalidation
    const historyKey = `${key}:${trigger}:${event.timestamp}`
    this.invalidationHistory.set(historyKey, event.timestamp)

    // Clean old history (keep last 24 hours)
    const twentyFourHoursAgo = Date.now() - 86400000
    for (const [historyKey, timestamp] of this.invalidationHistory.entries()) {
      if (timestamp < twentyFourHoursAgo) {
        this.invalidationHistory.delete(historyKey)
      }
    }

    // Invalidate the key itself
    await this.cache.delete(key)

    // Handle dependent invalidations
    await this.handleDependentInvalidations(key, trigger)

    logger.debug('Cache invalidation processed', {
      key,
      trigger,
      timestamp: event.timestamp,
    })
  }

  private async handleUpdate(event: CacheEvent): Promise<void> {
    const { key, data, metadata } = event

    // Check if any invalidation rules apply
    const dependency = this.dependencies.get(key)
    if (dependency) {
      for (const rule of dependency.invalidationRules) {
        if (this.shouldInvalidate(rule, data, metadata)) {
          const delay = rule.delay || 0

          if (delay > 0) {
            setTimeout(() => this.invalidate(key, rule.trigger), delay)
          } else {
            await this.invalidate(key, rule.trigger)
          }

          if (rule.cascade) {
            await this.handleDependentInvalidations(key, rule.trigger)
          }

          break // Apply only first matching rule
        }
      }
    }
  }

  private async handleDelete(event: CacheEvent): Promise<void> {
    const { key } = event

    // Delete from cache
    await this.cache.delete(key)

    // Handle dependent invalidations
    await this.handleDependentInvalidations(key, 'event_based')
  }

  private async handleDependentInvalidations(
    key: string,
    trigger: InvalidationTrigger
  ): Promise<void> {
    const dependentKeys: string[] = []

    // Find all dependencies that include this key
    for (const [depKey, dependency] of this.dependencies.entries()) {
      if (dependency.dependentKeys.includes(key)) {
        dependentKeys.push(depKey)
      }
    }

    // Invalidate dependent keys
    const invalidationPromises = dependentKeys.map(async depKey => {
      // Apply delay if specified in rules
      const dependency = this.dependencies.get(depKey)
      if (dependency) {
        for (const rule of dependency.invalidationRules) {
          if (rule.trigger === trigger || rule.trigger === 'dependency_based') {
            const delay = rule.delay || 0

            if (delay > 0) {
              setTimeout(() => this.cache.delete(depKey), delay)
            } else {
              await this.cache.delete(depKey)
            }
            break
          }
        }
      }
    })

    await Promise.allSettled(invalidationPromises)

    if (dependentKeys.length > 0) {
      logger.debug('Dependent cache invalidations processed', {
        originalKey: key,
        dependentKeys: dependentKeys.length,
        trigger,
      })
    }
  }

  private shouldInvalidate(
    rule: InvalidationRule,
    data: unknown,
    metadata?: Record<string, unknown>
  ): boolean {
    if (!rule.condition) return true

    try {
      return rule.condition(data, metadata)
    } catch (error) {
      logger.error('Error evaluating invalidation condition', {
        error: (error as Error).message,
      })
      return false
    }
  }
}

// Factory functions for common invalidation strategies
export function createTimeBasedInvalidationStrategy(
  cache: CacheInvalidationStrategy['cache']
): CacheInvalidationStrategy {
  return new CacheInvalidationStrategy(cache, {
    maxEventQueueSize: 500,
    batchSize: 5,
    processingDelay: 200,
  })
}

export function createEventBasedInvalidationStrategy(
  cache: CacheInvalidationStrategy['cache']
): CacheInvalidationStrategy {
  return new CacheInvalidationStrategy(cache, {
    maxEventQueueSize: 1000,
    batchSize: 20,
    processingDelay: 50,
  })
}

export function createDependencyBasedInvalidationStrategy(
  cache: CacheInvalidationStrategy['cache']
): CacheInvalidationStrategy {
  return new CacheInvalidationStrategy(cache, {
    maxEventQueueSize: 200,
    batchSize: 10,
    processingDelay: 100,
  })
}
