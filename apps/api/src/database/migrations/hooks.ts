import {
  Migration,
  MigrationStatus,
  MigrationHook,
  MigrationContext,
  MigrationLogger
} from './types'

/**
 * Migration hook system for automated execution
 */
export class MigrationHooks {
  private hooks: {
    beforeMigration: MigrationHook[]
    afterMigration: MigrationHook[]
    beforeRollback: MigrationHook[]
    afterRollback: MigrationHook[]
    onValidationError: MigrationHook[]
    onMigrationStart: MigrationHook[]
    onMigrationComplete: MigrationHook[]
    onMigrationFail: MigrationHook[]
  } = {
    beforeMigration: [],
    afterMigration: [],
    beforeRollback: [],
    afterRollback: [],
    onValidationError: [],
    onMigrationStart: [],
    onMigrationComplete: [],
    onMigrationFail: []
  }

  private logger: MigrationLogger

  constructor(logger?: MigrationLogger) {
    this.logger = logger || this.createDefaultLogger()
  }

  /**
   * Register a hook
   */
  registerHook(
    event: keyof typeof MigrationHooks.prototype.hooks,
    hook: MigrationHook
  ): void {
    if (!this.hooks[event]) {
      throw new Error(`Unknown hook event: ${event}`)
    }

    this.hooks[event].push(hook)
    this.logger.debug(`Registered migration hook`, { event })
  }

  /**
   * Remove a hook
   */
  removeHook(
    event: keyof typeof MigrationHooks.prototype.hooks,
    hook: MigrationHook
  ): void {
    if (!this.hooks[event]) {
      return
    }

    const index = this.hooks[event].indexOf(hook)
    if (index !== -1) {
      this.hooks[event].splice(index, 1)
      this.logger.debug(`Removed migration hook`, { event })
    }
  }

  /**
   * Execute hooks for a specific event
   */
  async executeHooks(
    event: keyof typeof MigrationHooks.prototype.hooks,
    migration: Migration,
    context: MigrationContext
  ): Promise<void> {
    const hooks = this.hooks[event] || []

    if (hooks.length === 0) {
      return
    }

    this.logger.debug(`Executing ${hooks.length} hooks for event: ${event}`, {
      migrationId: migration.id,
      version: migration.version
    })

    const errors: Error[] = []

    for (const hook of hooks) {
      try {
        await hook(migration, context)
        this.logger.debug(`Hook executed successfully`, {
          event,
          migrationId: migration.id,
          hookName: hook.name || 'anonymous'
        })
      } catch (error) {
        const err = error as Error
        this.logger.error(`Hook execution failed`, {
          event,
          migrationId: migration.id,
          hookName: hook.name || 'anonymous',
          error: err.message
        })
        errors.push(err)

        // Decide whether to continue or stop based on the event
        if (this.shouldStopOnError(event)) {
          break
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Hooks failed for ${event}: ${errors.map(e => e.message).join('; ')}`)
    }
  }

  /**
   * Get all registered hooks
   */
  getHooks(): Record<string, string[]> {
    const result: Record<string, string[]> = {}

    for (const [event, hooks] of Object.entries(this.hooks)) {
      result[event] = hooks.map(h => h.name || 'anonymous')
    }

    return result
  }

  /**
   * Clear all hooks
   */
  clearHooks(): void {
    for (const event of Object.keys(this.hooks)) {
      this.hooks[event as keyof typeof this.hooks] = []
    }
    this.logger.info('All migration hooks cleared')
  }

  /**
   * Determine if execution should stop on error for a given event
   */
  private shouldStopOnError(event: keyof typeof MigrationHooks.prototype.hooks): boolean {
    // Critical events that should stop execution on error
    const criticalEvents = [
      'beforeMigration',
      'beforeRollback',
      'onValidationError'
    ]

    return criticalEvents.includes(event)
  }

  /**
   * Create default logger
   */
  private createDefaultLogger(): MigrationLogger {
    return {
      debug: (message: string, ...args: any[]) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`[MigrationHooks] ${message}`, ...args)
        }
      },
      info: (message: string, ...args: any[]) => {
        console.info(`[MigrationHooks] ${message}`, ...args)
      },
      warn: (message: string, ...args: any[]) => {
        console.warn(`[MigrationHooks] ${message}`, ...args)
      },
      error: (message: string, ...args: any[]) => {
        console.error(`[MigrationHooks] ${message}`, ...args)
      },
      log: (level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]) => {
        console[level](`[MigrationHooks] ${message}`, ...args)
      }
    }
  }
}

/**
 * Built-in migration hooks
 */
export class BuiltInHooks {
  /**
   * Create a hook that logs migration start
   */
  static createLoggingHook(logger: MigrationLogger): MigrationHook {
    return async function logMigrationStart(
      migration: Migration,
      context: MigrationContext
    ): Promise<void> {
      logger.info('Migration started', {
        id: migration.id,
        version: migration.version,
        name: migration.name,
        action: context.action,
        dryRun: context.dryRun
      })
    }
  }

  /**
   * Create a hook that logs migration completion
   */
  static createCompletionLoggingHook(logger: MigrationLogger): MigrationHook {
    return async function logMigrationComplete(
      migration: Migration,
      context: MigrationContext
    ): Promise<void> {
      const executionTime = Date.now() - context.startTime
      logger.info('Migration completed', {
        id: migration.id,
        version: migration.version,
        name: migration.name,
        action: context.action,
        dryRun: context.dryRun,
        executionTime
      })
    }
  }

  /**
   * Create a hook that validates migration context
   */
  static createContextValidationHook(): MigrationHook {
    return async function validateContext(
      migration: Migration,
      context: MigrationContext
    ): Promise<void> {
      if (!context.dryRun && context.action === 'down' && !migration.down) {
        throw new Error(`Cannot rollback migration ${migration.version}: no rollback SQL provided`)
      }

      if (!context.options) {
        throw new Error('Migration context missing options')
      }
    }
  }

  /**
   * Create a hook that checks for concurrent migrations
   */
  static createConcurrencyCheckHook(
    isRunning: { value: boolean }
  ): MigrationHook {
    return async function checkConcurrency(
      migration: Migration,
      context: MigrationContext
    ): Promise<void> {
      if (context.dryRun) {
        return // Skip concurrency check in dry run mode
      }

      if (isRunning.value) {
        throw new Error('Another migration is already running')
      }

      isRunning.value = true
    }
  }

  /**
   * Create a hook that releases concurrency lock
   */
  static createConcurrencyReleaseHook(
    isRunning: { value: boolean }
  ): MigrationHook {
    return async function releaseConcurrency(
      migration: Migration,
      context: MigrationContext
    ): Promise<void> {
      isRunning.value = false
    }
  }

  /**
   * Create a hook that backs up data before destructive migrations
   */
  static createBackupHook(
    backupFunction: (migration: Migration, context: MigrationContext) => Promise<void>
  ): MigrationHook {
    return async function createBackup(
      migration: Migration,
      context: MigrationContext
    ): Promise<void> {
      if (context.dryRun) {
        return
      }

      // Check if migration contains destructive operations
      const destructivePatterns = [
        /DROP\s+TABLE/i,
        /DELETE\s+FROM/i,
        /TRUNCATE/i
      ]

      const hasDestructiveOps = destructivePatterns.some(pattern =>
        pattern.test(migration.up)
      )

      if (hasDestructiveOps) {
        await backupFunction(migration, context)
      }
    }
  }

  /**
   * Create a hook that sends notifications
   */
  static createNotificationHook(
    notificationFunction: (
      migration: Migration,
      context: MigrationContext,
      status: 'started' | 'completed' | 'failed'
    ) => Promise<void>
  ): MigrationHook {
    return async function sendNotification(
      migration: Migration,
      context: MigrationContext
    ): Promise<void> {
      const status = context.action === 'up' ? 'started' :
                    context.action === 'down' ? 'completed' : 'failed'

      await notificationFunction(migration, context, status)
    }
  }

  /**
   * Create a hook that validates environment conditions
   */
  static createEnvironmentValidationHook(
    validationFunction: () => Promise<boolean>,
    errorMessage: string = 'Environment conditions not met for migration'
  ): MigrationHook {
    return async function validateEnvironment(
      migration: Migration,
      context: MigrationContext
    ): Promise<void> {
      if (context.dryRun) {
        return
      }

      const isValid = await validationFunction()
      if (!isValid) {
        throw new Error(errorMessage)
      }
    }
  }

  /**
   * Create a hook that measures migration performance
   */
  static createPerformanceMonitoringHook(
    metricsCollector: (metrics: {
      migrationId: string
      version: string
      action: string
      executionTime: number
      timestamp: number
    }) => void
  ): MigrationHook {
    return async function monitorPerformance(
      migration: Migration,
      context: MigrationContext
    ): Promise<void> {
      const executionTime = Date.now() - context.startTime

      metricsCollector({
        migrationId: migration.id,
        version: migration.version,
        action: context.action,
        executionTime,
        timestamp: Date.now()
      })
    }
  }

  /**
   * Create a hook that implements rate limiting
   */
  static createRateLimitHook(
    rateLimiter: {
      canProceed: () => Promise<boolean>
      waitTime: () => Promise<number>
    }
  ): MigrationHook {
    return async function enforceRateLimit(
      migration: Migration,
      context: MigrationContext
    ): Promise<void> {
      if (context.dryRun) {
        return
      }

      const canProceed = await rateLimiter.canProceed()
      if (!canProceed) {
        const waitTime = await rateLimiter.waitTime()
        throw new Error(`Rate limit exceeded. Wait ${waitTime}ms before retrying.`)
      }
    }
  }

  /**
   * Create a hook that implements circuit breaker pattern
   */
  static createCircuitBreakerHook(
    circuitBreaker: {
      isOpen: () => boolean
      recordSuccess: () => void
      recordFailure: () => void
    }
  ): MigrationHook {
    return async function circuitBreakerCheck(
      migration: Migration,
      context: MigrationContext
    ): Promise<void> {
      if (circuitBreaker.isOpen()) {
        throw new Error('Circuit breaker is open - migrations temporarily disabled')
      }
    }
  }

  /**
   * Create a hook that implements retry logic
   */
  static createRetryHook(
    retryFunction: (
      migration: Migration,
      context: MigrationContext,
      attempt: number,
      error: Error
    ) => Promise<boolean>
  ): MigrationHook {
    return async function retryMigration(
      migration: Migration,
      context: MigrationContext
    ): Promise<void> {
      // This hook would need to be integrated with the runner's retry logic
      // For now, it's a placeholder for the concept
    }
  }
}

/**
 * Migration hook registry for managing hooks globally
 */
export class MigrationHookRegistry {
  private static instance: MigrationHookRegistry
  private hooks: MigrationHooks

  private constructor() {
    this.hooks = new MigrationHooks()
  }

  /**
   * Get singleton instance
   */
  static getInstance(): MigrationHookRegistry {
    if (!MigrationHookRegistry.instance) {
      MigrationHookRegistry.instance = new MigrationHookRegistry()
    }
    return MigrationHookRegistry.instance
  }

  /**
   * Register a global hook
   */
  registerHook(
    event: keyof typeof MigrationHooks.prototype.hooks,
    hook: MigrationHook
  ): void {
    this.hooks.registerHook(event, hook)
  }

  /**
   * Execute global hooks
   */
  async executeHooks(
    event: keyof typeof MigrationHooks.prototype.hooks,
    migration: Migration,
    context: MigrationContext
  ): Promise<void> {
    await this.hooks.executeHooks(event, migration, context)
  }

  /**
   * Get hooks instance
   */
  getHooks(): MigrationHooks {
    return this.hooks
  }
}

/**
 * Factory function to create migration hooks
 */
export function createMigrationHooks(logger?: MigrationLogger): MigrationHooks {
  return new MigrationHooks(logger)
}

/**
 * Get global migration hook registry
 */
export function getMigrationHookRegistry(): MigrationHookRegistry {
  return MigrationHookRegistry.getInstance()
}
