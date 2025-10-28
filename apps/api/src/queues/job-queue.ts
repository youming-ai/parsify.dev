import { z } from 'zod'
import { createDatabaseClient } from '../database'
import { type Job, JobPriority } from '../models/job'
import type { JobService } from '../services/job_service'

// Queue configuration schema
export const QueueConfigSchema = z.object({
  queueName: z.string(),
  deadLetterQueueName: z.string().optional(),
  maxRetries: z.number().min(0).max(10).default(3),
  retryDelayBaseMs: z.number().min(1000).default(1000),
  maxRetryDelayMs: z.number().min(5000).default(300000), // 5 minutes
  visibilityTimeoutMs: z.number().min(30000).default(300000), // 5 minutes
  batchSize: z.number().min(1).max(100).default(10),
  enableDeadLetterQueue: z.boolean().default(true),
  enableMetrics: z.boolean().default(true),
})

export type QueueConfig = z.infer<typeof QueueConfigSchema>

// Job queue message schema
export const JobQueueMessageSchema = z.object({
  jobId: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  toolId: z.string().uuid(),
  priority: JobPriority.default('normal'),
  attemptNumber: z.number().min(0).default(0),
  scheduledAt: z.number().default(() => Date.now()),
  timeoutMs: z.number().min(1000).default(30000),
  metadata: z.record(z.any()).optional(),
})

export type JobQueueMessage = z.infer<typeof JobQueueMessageSchema>

// Queue metrics schema
export const QueueMetricsSchema = z.object({
  totalJobs: z.number().default(0),
  pendingJobs: z.number().default(0),
  runningJobs: z.number().default(0),
  completedJobs: z.number().default(0),
  failedJobs: z.number().default(0),
  deadLetterJobs: z.number().default(0),
  avgProcessingTimeMs: z.number().default(0),
  lastProcessedAt: z.number().nullable().default(null),
  throughputPerMinute: z.number().default(0),
})

export type QueueMetrics = z.infer<typeof QueueMetricsSchema>

// Queue processor interface
export interface QueueProcessor {
  process(message: JobQueueMessage): Promise<void>
  onMessageError?(message: JobQueueMessage, error: Error): Promise<void>
  onMessageSuccess?(message: JobQueueMessage): Promise<void>
}

// Queue system options
export interface QueueSystemOptions {
  jobService: JobService
  db: D1Database
  queue: MessageBatch
  env: {
    [key: string]: any
  }
  config?: Partial<QueueConfig>
}

/**
 * Job Queue System using Cloudflare Queues
 *
 * This class provides a comprehensive queue system for async job processing
 * with retry logic, dead letter queues, and monitoring capabilities.
 */
export class JobQueueSystem {
  private jobService: JobService
  private db: D1Database
  private queue: MessageBatch
  private env: Record<string, any>
  private config: QueueConfig
  private metrics: QueueMetrics
  private processors: Map<string, QueueProcessor> = new Map()

  constructor(options: QueueSystemOptions) {
    this.jobService = options.jobService
    this.db = options.db
    this.queue = options.queue
    this.env = options.env
    this.client = createDatabaseClient(this.db)

    // Default configuration
    this.config = QueueConfigSchema.parse({
      queueName: 'job-processing',
      deadLetterQueueName: 'job-processing-dlq',
      maxRetries: 3,
      retryDelayBaseMs: 1000,
      maxRetryDelayMs: 300000,
      visibilityTimeoutMs: 300000,
      batchSize: 10,
      enableDeadLetterQueue: true,
      enableMetrics: true,
      ...options.config,
    })

    this.metrics = {
      totalJobs: 0,
      pendingJobs: 0,
      runningJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      deadLetterJobs: 0,
      avgProcessingTimeMs: 0,
      lastProcessedAt: null,
      throughputPerMinute: 0,
    }
  }

  /**
   * Register a processor for specific job types
   */
  registerProcessor(toolId: string, processor: QueueProcessor): void {
    this.processors.set(toolId, processor)
  }

  /**
   * Add a job to the queue
   */
  async enqueueJob(
    job: Job,
    options: {
      priority?: JobPriority
      delay?: number
      scheduledAt?: number
    } = {}
  ): Promise<void> {
    const message: JobQueueMessage = {
      jobId: job.id,
      userId: job.user_id,
      toolId: job.tool_id,
      priority: options.priority || 'normal',
      attemptNumber: 0,
      scheduledAt: options.scheduledAt || (options.delay ? Date.now() + options.delay : Date.now()),
      timeoutMs: job.input_data?._timeoutMs || 30000,
      metadata: {
        inputRef: job.input_ref,
        priority: job.input_data?._priority,
      },
    }

    try {
      // Validate message
      JobQueueMessageSchema.parse(message)

      // Send to appropriate queue based on priority
      const queueName = this.getQueueNameByPriority(message.priority)

      // Update metrics
      this.metrics.totalJobs++
      this.metrics.pendingJobs++

      // In Cloudflare Queues, we would send the message
      // For now, we'll store in KV for queue emulation
      const queueKey = `${queueName}:${message.jobId}`
      await this.env.QUEUE_KV.put(queueKey, JSON.stringify(message), {
        expirationTtl: 3600, // 1 hour TTL
      })

      console.log(`Job ${message.jobId} enqueued to ${queueName}`)
    } catch (error) {
      console.error(`Failed to enqueue job ${job.id}:`, error)
      throw new Error(`Failed to enqueue job: ${error}`)
    }
  }

  /**
   * Process messages from the queue
   */
  async processQueue(): Promise<void> {
    const startTime = Date.now()
    let processedCount = 0

    try {
      // Process messages from Cloudflare Queue
      for (const message of this.queue.messages) {
        try {
          const queueMessage = this.parseMessage(message.body)
          await this.processMessage(queueMessage)
          processedCount++

          // Acknowledge the message
          message.ack()
        } catch (error) {
          console.error('Failed to process queue message:', error)

          // Retry logic with exponential backoff
          await this.handleMessageError(message, error as Error)
        }
      }

      // Update metrics
      const processingTime = Date.now() - startTime
      this.updateMetrics(processedCount, processingTime)
    } catch (error) {
      console.error('Queue processing failed:', error)
      throw error
    }
  }

  /**
   * Get queue metrics
   */
  getMetrics(): QueueMetrics {
    return { ...this.metrics }
  }

  /**
   * Get queue size for all priorities
   */
  async getQueueSize(): Promise<number> {
    try {
      let totalSize = 0
      const priorities = ['urgent', 'high', 'normal', 'low']

      for (const priority of priorities) {
        const queueName = this.getQueueNameByPriority(priority as JobPriority)
        const list = await this.env.QUEUE_KV.list({ prefix: `${queueName}:` })
        totalSize += list.keys.length
      }

      return totalSize
    } catch (error) {
      console.error('Failed to get queue size:', error)
      return 0
    }
  }

  /**
   * Get dead letter queue size
   */
  async getDeadLetterQueueSize(): Promise<number> {
    try {
      const list = await this.env.QUEUE_KV.list({
        prefix: `${this.config.deadLetterQueueName}:`,
      })
      return list.keys.length
    } catch (error) {
      console.error('Failed to get dead letter queue size:', error)
      return 0
    }
  }

  /**
   * Requeue jobs from dead letter queue
   */
  async requeueDeadLetterJobs(limit = 10): Promise<number> {
    if (!this.config.enableDeadLetterQueue) {
      return 0
    }

    let requeuedCount = 0

    try {
      const list = await this.env.QUEUE_KV.list({
        prefix: `${this.config.deadLetterQueueName}:`,
        limit,
      })

      for (const key of list.keys) {
        try {
          const messageData = await this.env.QUEUE_KV.get(key.name)
          if (!messageData) continue

          const message = JSON.parse(messageData)
          const dlqMessage = JobQueueMessageSchema.parse(message)

          // Reset attempt count and requeue
          dlqMessage.attemptNumber = 0
          await this.enqueueJob((await this.jobService.getJobById(dlqMessage.jobId)) as Job, {
            priority: dlqMessage.priority,
          })

          // Remove from dead letter queue
          await this.env.QUEUE_KV.delete(key.name)
          requeuedCount++
        } catch (error) {
          console.error(`Failed to requeue job from DLQ ${key.name}:`, error)
        }
      }

      this.metrics.deadLetterJobs -= requeuedCount
      return requeuedCount
    } catch (error) {
      console.error('Failed to requeue dead letter jobs:', error)
      return 0
    }
  }

  /**
   * Clean up old processed jobs from queues
   */
  async cleanup(olderThanHours = 24): Promise<number> {
    const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000
    let cleanedCount = 0

    try {
      // Clean up all priority queues
      const priorities = ['urgent', 'high', 'normal', 'low']

      for (const priority of priorities) {
        const queueName = this.getQueueNameByPriority(priority as JobPriority)
        const list = await this.env.QUEUE_KV.list({ prefix: `${queueName}:` })

        for (const key of list.keys) {
          try {
            const messageData = await this.env.QUEUE_KV.get(key.name)
            if (!messageData) continue

            const message = JSON.parse(messageData)
            if (message.scheduledAt < cutoffTime) {
              await this.env.QUEUE_KV.delete(key.name)
              cleanedCount++
            }
          } catch (error) {
            console.error(`Failed to cleanup queue item ${key.name}:`, error)
          }
        }
      }

      return cleanedCount
    } catch (error) {
      console.error('Failed to cleanup queues:', error)
      return 0
    }
  }

  // Private methods

  private getQueueNameByPriority(priority: JobPriority): string {
    return `${this.config.queueName}-${priority}`
  }

  private parseMessage(body: string): JobQueueMessage {
    try {
      const message = JSON.parse(body)
      return JobQueueMessageSchema.parse(message)
    } catch (error) {
      throw new Error(`Invalid queue message format: ${error}`)
    }
  }

  private async processMessage(message: JobQueueMessage): Promise<void> {
    const startTime = Date.now()

    try {
      // Check if job still exists and is in correct state
      const job = await this.jobService.getJobById(message.jobId)
      if (!job) {
        console.warn(`Job ${message.jobId} not found, skipping`)
        return
      }

      if (!job.isPending) {
        console.warn(`Job ${message.jobId} is not in pending state (${job.status}), skipping`)
        return
      }

      // Mark job as running
      await this.jobService.startJob(job.id)
      this.metrics.runningJobs++
      this.metrics.pendingJobs--

      // Get processor for this job type
      const processor = this.processors.get(message.toolId)
      if (!processor) {
        throw new Error(`No processor registered for tool ${message.toolId}`)
      }

      // Process the job
      await processor.process(message)

      // Mark job as completed
      await this.jobService.completeJob(job.id)
      this.metrics.completedJobs++
      this.metrics.runningJobs--

      // Call success callback if provided
      if (processor.onMessageSuccess) {
        await processor.onMessageSuccess(message)
      }

      console.log(`Job ${message.jobId} completed successfully`)
    } catch (error) {
      // Mark job as failed
      await this.jobService.failJob(message.jobId, (error as Error).message)
      this.metrics.failedJobs++
      this.metrics.runningJobs--

      throw error
    } finally {
      const processingTime = Date.now() - startTime
      this.updateAvgProcessingTime(processingTime)
    }
  }

  private async handleMessageError(message: any, error: Error): Promise<void> {
    try {
      const queueMessage = this.parseMessage(message.body)
      queueMessage.attemptNumber++

      if (queueMessage.attemptNumber <= this.config.maxRetries) {
        // Calculate retry delay with exponential backoff
        const delayMs = Math.min(
          this.config.retryDelayBaseMs * 2 ** (queueMessage.attemptNumber - 1),
          this.config.maxRetryDelayMs
        )

        // Schedule retry
        queueMessage.scheduledAt = Date.now() + delayMs

        // Requeue with delay
        const queueName = this.getQueueNameByPriority(queueMessage.priority)
        const queueKey = `${queueName}:${queueMessage.jobId}`

        await this.env.QUEUE_KV.put(queueKey, JSON.stringify(queueMessage), {
          expirationTtl: 3600,
        })

        console.log(
          `Job ${queueMessage.jobId} scheduled for retry ${queueMessage.attemptNumber}/${this.config.maxRetries} in ${delayMs}ms`
        )
      } else {
        // Max retries exceeded, send to dead letter queue
        if (this.config.enableDeadLetterQueue) {
          await this.sendToDeadLetterQueue(queueMessage, error)
        }

        console.error(`Job ${queueMessage.jobId} max retries exceeded, sent to DLQ`)
      }

      // Acknowledge the message to prevent reprocessing
      message.ack()
    } catch (retryError) {
      console.error('Failed to handle message error:', retryError)
      // Still acknowledge to prevent infinite retry loops
      message.ack()
    }
  }

  private async sendToDeadLetterQueue(message: JobQueueMessage, error: Error): Promise<void> {
    try {
      const dlqMessage = {
        ...message,
        lastError: error.message,
        failedAt: Date.now(),
      }

      const dlqKey = `${this.config.deadLetterQueueName}:${message.jobId}`
      await this.env.QUEUE_KV.put(dlqKey, JSON.stringify(dlqMessage), {
        expirationTtl: 7 * 24 * 3600, // 7 days TTL
      })

      this.metrics.deadLetterJobs++
    } catch (dlqError) {
      console.error('Failed to send message to dead letter queue:', dlqError)
    }
  }

  private updateMetrics(processedCount: number, processingTimeMs: number): void {
    this.metrics.lastProcessedAt = Date.now()

    // Calculate throughput per minute
    if (processingTimeMs > 0) {
      this.metrics.throughputPerMinute = Math.round((processedCount * 60000) / processingTimeMs)
    }

    // Sync metrics with database periodically
    if (this.config.enableMetrics) {
      this.syncMetricsToDatabase().catch(error => {
        console.error('Failed to sync metrics to database:', error)
      })
    }
  }

  private updateAvgProcessingTime(processingTimeMs: number): void {
    const totalProcessed = this.metrics.completedJobs + this.metrics.failedJobs
    if (totalProcessed === 0) {
      this.metrics.avgProcessingTimeMs = processingTimeMs
    } else {
      this.metrics.avgProcessingTimeMs = Math.round(
        (this.metrics.avgProcessingTimeMs * (totalProcessed - 1) + processingTimeMs) /
          totalProcessed
      )
    }
  }

  private async syncMetricsToDatabase(): Promise<void> {
    try {
      // Store metrics in KV for monitoring
      await this.env.QUEUE_KV.put(
        'queue_metrics',
        JSON.stringify({
          ...this.metrics,
          updatedAt: Date.now(),
        }),
        {
          expirationTtl: 3600, // 1 hour TTL
        }
      )
    } catch (error) {
      console.error('Failed to sync metrics:', error)
    }
  }
}

// Default queue processor for WASM tool execution
export class WasmToolProcessor implements QueueProcessor {
  constructor(
    private wasmModuleLoader: any,
    private jobService: JobService
  ) {}

  async process(message: JobQueueMessage): Promise<void> {
    try {
      // Get job details
      const job = await this.jobService.getJobById(message.jobId)
      if (!job) {
        throw new Error(`Job ${message.jobId} not found`)
      }

      // Update job progress
      await this.jobService.updateJobProgress(job.id, 10, 'Initializing WASM module')

      // Load WASM module
      const module = await this.wasmModuleLoader.loadModule(message.toolId)
      if (!module) {
        throw new Error(`WASM module for tool ${message.toolId} not found`)
      }

      // Update progress
      await this.jobService.updateJobProgress(job.id, 30, 'Processing input data')

      // Execute WASM module with job input
      const inputData = job.input_data || {}
      const result = await module.execute(inputData)

      // Update progress
      await this.jobService.updateJobProgress(job.id, 80, 'Processing output')

      // Store output and complete job
      await this.jobService.completeJob(job.id, result)
      await this.jobService.updateJobProgress(job.id, 100, 'Job completed')
    } catch (error) {
      console.error(`WASM tool processing failed for job ${message.jobId}:`, error)
      throw error
    }
  }

  async onMessageError(message: JobQueueMessage, error: Error): Promise<void> {
    console.error(`WASM tool processing failed for job ${message.jobId}:`, error)
    await this.jobService.updateJobProgress(message.jobId, 0, `Error: ${error.message}`)
  }

  async onMessageSuccess(message: JobQueueMessage): Promise<void> {
    console.log(`WASM tool processing completed for job ${message.jobId}`)
  }
}
