import { Job, JobPriority } from '../models/job'
import { JobService } from '../services/job_service'
import { JobQueueSystem, QueueConfig, WasmToolProcessor, QueueProcessor } from './job-queue'

/**
 * Queue Manager - orchestrates multiple queue systems and provides high-level job management
 */
export class QueueManager {
  private jobService: JobService
  private queueSystems: Map<string, JobQueueSystem> = new Map()
  private processors: Map<string, QueueProcessor> = new Map()
  private db: D1Database
  private env: Record<string, any>

  constructor(
    jobService: JobService,
    db: D1Database,
    env: Record<string, any>
  ) {
    this.jobService = jobService
    this.db = db
    this.env = env

    // Initialize default queue system
    this.initializeDefaultQueues()
  }

  /**
   * Initialize default queue systems for different job types
   */
  private initializeDefaultQueues(): void {
    // Default job processing queue
    const defaultQueueConfig: Partial<QueueConfig> = {
      queueName: 'job-processing',
      deadLetterQueueName: 'job-processing-dlq',
      maxRetries: 3,
      retryDelayBaseMs: 1000,
      maxRetryDelayMs: 300000, // 5 minutes
      visibilityTimeoutMs: 300000, // 5 minutes
      batchSize: 10,
      enableDeadLetterQueue: true,
      enableMetrics: true,
    }

    // High priority queue for urgent jobs
    const highPriorityQueueConfig: Partial<QueueConfig> = {
      ...defaultQueueConfig,
      queueName: 'job-processing-urgent',
      deadLetterQueueName: 'job-processing-urgent-dlq',
      maxRetries: 5, // More retries for urgent jobs
      retryDelayBaseMs: 500, // Faster retry for urgent jobs
    }

    // Batch processing queue for bulk operations
    const batchQueueConfig: Partial<QueueConfig> = {
      ...defaultQueueConfig,
      queueName: 'job-processing-batch',
      deadLetterQueueName: 'job-processing-batch-dlq',
      maxRetries: 2, // Fewer retries for batch jobs
      retryDelayBaseMs: 5000, // Slower retry for batch jobs
      batchSize: 50, // Larger batch size
      visibilityTimeoutMs: 1800000, // 30 minutes for batch jobs
    }

    // Create queue systems
    // Note: We'll create them on-demand when needed with actual queue objects
  }

  /**
   * Get or create a queue system for specific configuration
   */
  getQueueSystem(config?: Partial<QueueConfig>, queue?: MessageBatch): JobQueueSystem {
    const queueName = config?.queueName || 'job-processing'

    if (!this.queueSystems.has(queueName)) {
      const queueSystem = new JobQueueSystem({
        jobService: this.jobService,
        db: this.db,
        queue: queue || { messages: [] } as MessageBatch,
        env: this.env,
        config,
      })

      // Register default processors
      this.registerDefaultProcessors(queueSystem)

      this.queueSystems.set(queueName, queueSystem)
    }

    return this.queueSystems.get(queueName)!
  }

  /**
   * Register default processors for different job types
   */
  private registerDefaultProcessors(queueSystem: JobQueueSystem): void {
    // WASM tool processor for JSON processing
    queueSystem.registerProcessor('json-formatter', new WasmToolProcessor(
      this.env.WASM_MODULE_LOADER,
      this.jobService
    ))

    queueSystem.registerProcessor('json-validator', new WasmToolProcessor(
      this.env.WASM_MODULE_LOADER,
      this.jobService
    ))

    queueSystem.registerProcessor('json-converter', new WasmToolProcessor(
      this.env.WASM_MODULE_LOADER,
      this.jobService
    ))

    queueSystem.registerProcessor('code-formatter', new WasmToolProcessor(
      this.env.WASM_MODULE_LOADER,
      this.jobService
    ))

    queueSystem.registerProcessor('code-executor', new WasmToolProcessor(
      this.env.WASM_MODULE_LOADER,
      this.jobService
    ))

    // Register custom processors
    for (const [toolId, processor] of this.processors) {
      queueSystem.registerProcessor(toolId, processor)
    }
  }

  /**
   * Register a custom processor for a specific job type
   */
  registerProcessor(toolId: string, processor: QueueProcessor): void {
    this.processors.set(toolId, processor)

    // Register with all existing queue systems
    for (const queueSystem of this.queueSystems.values()) {
      queueSystem.registerProcessor(toolId, processor)
    }
  }

  /**
   * Submit a job to the appropriate queue based on priority and type
   */
  async submitJob(
    job: Job,
    options: {
      priority?: JobPriority
      queue?: string
      delay?: number
    } = {}
  ): Promise<void> {
    const priority = options.priority || 'normal'

    // Select appropriate queue system
    let queueSystem: JobQueueSystem
    let queueName = options.queue

    if (!queueName) {
      // Auto-select queue based on priority and job characteristics
      if (priority === 'urgent') {
        queueName = 'job-processing-urgent'
      } else if (job.input_data?._batch === true) {
        queueName = 'job-processing-batch'
      } else {
        queueName = 'job-processing'
      }
    }

    queueSystem = this.getQueueSystem({ queueName })

    // Enqueue the job
    await queueSystem.enqueueJob(job, {
      priority,
      delay: options.delay,
    })

    console.log(`Job ${job.id} submitted to queue ${queueName} with priority ${priority}`)
  }

  /**
   * Submit multiple jobs (batch processing)
   */
  async submitJobs(
    jobs: Job[],
    options: {
      priority?: JobPriority
      queue?: string
      delay?: number
    } = {}
  ): Promise<void> {
    const queueName = options.queue || 'job-processing-batch'
    const queueSystem = this.getQueueSystem({ queueName })

    // Enqueue all jobs
    const promises = jobs.map(job =>
      queueSystem.enqueueJob(job, {
        priority: options.priority,
        delay: options.delay,
      })
    )

    await Promise.all(promises)
    console.log(`Submitted ${jobs.length} jobs to queue ${queueName}`)
  }

  /**
   * Process messages from all queue systems
   */
  async processQueues(queues: MessageBatch[]): Promise<void> {
    const promises = queues.map(queue => {
      // Determine which queue system this belongs to based on queue name
      // This would need to be adjusted based on actual Cloudflare Queue configuration
      const queueSystem = this.getQueueSystem()
      return queueSystem.processQueue()
    })

    await Promise.allSettled(promises)
  }

  /**
   * Get combined metrics from all queue systems
   */
  async getAllMetrics(): Promise<Record<string, any>> {
    const metrics: Record<string, any> = {}
    let totalSize = 0
    let totalDeadLetterSize = 0

    for (const [queueName, queueSystem] of this.queueSystems) {
      metrics[queueName] = queueSystem.getMetrics()

      const queueSize = await queueSystem.getQueueSize()
      const deadLetterSize = await queueSystem.getDeadLetterQueueSize()

      metrics[queueName].queueSize = queueSize
      metrics[queueName].deadLetterQueueSize = deadLetterSize

      totalSize += queueSize
      totalDeadLetterSize += deadLetterSize
    }

    // Add aggregate metrics
    metrics.total = {
      queueSize: totalSize,
      deadLetterQueueSize: totalDeadLetterSize,
    }

    return metrics
  }

  /**
   * Requeue jobs from dead letter queues across all queue systems
   */
  async requeueDeadLetterJobs(limit = 10): Promise<number> {
    let totalRequeued = 0

    for (const queueSystem of this.queueSystems.values()) {
      const requeued = await queueSystem.requeueDeadLetterJobs(limit)
      totalRequeued += requeued
    }

    return totalRequeued
  }

  /**
   * Clean up old jobs from all queue systems
   */
  async cleanup(olderThanHours = 24): Promise<number> {
    let totalCleaned = 0

    for (const queueSystem of this.queueSystems.values()) {
      const cleaned = await queueSystem.cleanup(olderThanHours)
      totalCleaned += cleaned
    }

    return totalCleaned
  }

  /**
   * Get queue statistics for monitoring
   */
  async getQueueStats(): Promise<{
    totalQueues: number
    totalJobs: number
    totalDeadLetterJobs: number
    averageProcessingTime: number
    successRate: number
    queueDetails: Array<{
      name: string
      size: number
      deadLetterSize: number
      metrics: any
    }>
  }> {
    const queueDetails = []
    let totalJobs = 0
    let totalDeadLetterJobs = 0
    let totalProcessingTime = 0
    let totalCompleted = 0
    let totalFailed = 0

    for (const [queueName, queueSystem] of this.queueSystems) {
      const metrics = queueSystem.getMetrics()
      const queueSize = await queueSystem.getQueueSize()
      const deadLetterSize = await queueSystem.getDeadLetterQueueSize()

      queueDetails.push({
        name: queueName,
        size: queueSize,
        deadLetterSize,
        metrics,
      })

      totalJobs += metrics.totalJobs
      totalDeadLetterJobs += metrics.deadLetterJobs
      totalProcessingTime += metrics.avgProcessingTimeMs
      totalCompleted += metrics.completedJobs
      totalFailed += metrics.failedJobs
    }

    const successRate = (totalCompleted + totalFailed) > 0
      ? (totalCompleted / (totalCompleted + totalFailed)) * 100
      : 0

    const averageProcessingTime = this.queueSystems.size > 0
      ? totalProcessingTime / this.queueSystems.size
      : 0

    return {
      totalQueues: this.queueSystems.size,
      totalJobs,
      totalDeadLetterJobs,
      averageProcessingTime: Math.round(averageProcessingTime),
      successRate: Math.round(successRate * 100) / 100,
      queueDetails,
    }
  }

  /**
   * Health check for all queue systems
   */
  async healthCheck(): Promise<{
    healthy: boolean
    issues: string[]
    queueSystems: Record<string, {
      healthy: boolean
      lastProcessedAt: number | null
      queueSize: number
      deadLetterQueueSize: number
    }>
  }> {
    const issues: string[] = []
    const queueSystems: Record<string, any> = {}
    let allHealthy = true

    for (const [queueName, queueSystem] of this.queueSystems) {
      const metrics = queueSystem.getMetrics()
      const queueSize = await queueSystem.getQueueSize()
      const deadLetterSize = await queueSystem.getDeadLetterQueueSize()

      const isHealthy = queueSize < 1000 && // Queue not too backed up
                       deadLetterSize < 100 && // DLQ not overflowing
                       (metrics.lastProcessedAt === null ||
                        Date.now() - metrics.lastProcessedAt < 300000) // Processed recently

      if (!isHealthy) {
        allHealthy = false

        if (queueSize >= 1000) {
          issues.push(`Queue ${queueName} has too many pending jobs: ${queueSize}`)
        }

        if (deadLetterSize >= 100) {
          issues.push(`Queue ${queueName} has too many dead letter jobs: ${deadLetterSize}`)
        }

        if (metrics.lastProcessedAt &&
            Date.now() - metrics.lastProcessedAt > 300000) {
          issues.push(`Queue ${queueName} hasn't processed jobs recently: last processed ${new Date(metrics.lastProcessedAt).toISOString()}`)
        }
      }

      queueSystems[queueName] = {
        healthy: isHealthy,
        lastProcessedAt: metrics.lastProcessedAt,
        queueSize,
        deadLetterQueueSize,
      }
    }

    return {
      healthy: allHealthy,
      issues,
      queueSystems,
    }
  }
}
