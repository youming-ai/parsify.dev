import { z } from 'zod'
import { type Job, JobPriority, type JobStatus } from '../models/job'

// Queue configuration types
export const QueueConfigSchema = z.object({
  name: z.string(),
  type: z.enum(['standard', 'priority', 'batch', 'delayed']).default('standard'),
  maxRetries: z.number().min(0).max(10).default(3),
  retryDelayBaseMs: z.number().min(1000).default(1000),
  maxRetryDelayMs: z.number().min(5000).default(300000),
  visibilityTimeoutMs: z.number().min(30000).default(300000),
  batchSize: z.number().min(1).max(100).default(10),
  enableDeadLetterQueue: z.boolean().default(true),
  enableMetrics: z.boolean().default(true),
  retentionHours: z.number().min(1).max(168).default(24),
  maxMessageSize: z
    .number()
    .min(1024)
    .max(1024 * 1024)
    .default(256 * 1024), // 256KB
  priorities: z.array(z.string()).default(['low', 'normal', 'high', 'urgent']),
})

export type QueueConfig = z.infer<typeof QueueConfigSchema>

// Job queue message types
export const JobQueueMessageSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  toolId: z.string().uuid(),
  priority: JobPriority.default('normal'),
  attemptNumber: z.number().min(0).default(0),
  scheduledAt: z.number().default(() => Date.now()),
  timeoutMs: z.number().min(1000).default(30000),
  delayMs: z.number().min(0).default(0),
  metadata: z.record(z.any()).optional(),
  payload: z.record(z.any()),
  traceId: z.string().optional(),
})

export type JobQueueMessage = z.infer<typeof JobQueueMessageSchema>

// Queue processor types
export interface QueueProcessor {
  process(message: JobQueueMessage): Promise<void>
  onMessageError?(message: JobQueueMessage, error: Error): Promise<void>
  onMessageSuccess?(message: JobQueueMessage): Promise<void>
  onMessageRetry?(message: JobQueueMessage, attempt: number): Promise<void>
}

// Queue event types
export const QueueEventSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([
    'job_enqueued',
    'job_started',
    'job_completed',
    'job_failed',
    'job_retry',
    'job_timeout',
    'queue_full',
    'dlq_moved',
  ]),
  queueName: z.string(),
  jobId: z.string().uuid(),
  timestamp: z.number(),
  metadata: z.record(z.any()).optional(),
})

export type QueueEvent = z.infer<typeof QueueEventSchema>

// Queue statistics types
export const QueueStatsSchema = z.object({
  queueName: z.string(),
  totalJobs: z.number().default(0),
  pendingJobs: z.number().default(0),
  runningJobs: z.number().default(0),
  completedJobs: z.number().default(0),
  failedJobs: z.number().default(0),
  deadLetterJobs: z.number().default(0),
  avgProcessingTimeMs: z.number().default(0),
  avgWaitTimeMs: z.number().default(0),
  throughputPerMinute: z.number().default(0),
  successRate: z.number().default(0),
  errorRate: z.number().default(0),
  retryRate: z.number().default(0),
  lastProcessedAt: z.number().nullable().default(null),
  queueDepth: z.number().default(0),
  maxConcurrency: z.number().default(0),
  currentConcurrency: z.number().default(0),
})

export type QueueStats = z.infer<typeof QueueStatsSchema>

// Queue health check types
export const QueueHealthCheckSchema = z.object({
  queueName: z.string(),
  status: z.enum(['healthy', 'warning', 'critical', 'unknown']),
  checks: z.array(
    z.object({
      name: z.string(),
      status: z.enum(['pass', 'fail', 'warn']),
      message: z.string(),
      value: z.any().optional(),
    })
  ),
  timestamp: z.number(),
  uptime: z.number().default(0),
  version: z.string().optional(),
})

export type QueueHealthCheck = z.infer<typeof QueueHealthCheckSchema>

// Queue manager configuration
export const QueueManagerConfigSchema = z.object({
  defaultQueueConfig: QueueConfigSchema.default({}),
  enableMonitoring: z.boolean().default(true),
  enableMetrics: z.boolean().default(true),
  enableAlerts: z.boolean().default(true),
  monitoringRetentionHours: z.number().min(1).max(168).default(24),
  healthCheckInterval: z.number().min(30000).max(300000).default(60000), // 1 minute
  metricsUpdateInterval: z.number().min(5000).max(60000).default(30000), // 30 seconds
  cleanupInterval: z.number().min(300000).max(3600000).default(1800000), // 30 minutes
  maxConcurrentJobs: z.number().min(1).max(1000).default(100),
  enableTracing: z.boolean().default(false),
})

export type QueueManagerConfig = z.infer<typeof QueueManagerConfigSchema>

// Job execution context
export const JobExecutionContextSchema = z.object({
  messageId: z.string().uuid(),
  jobId: z.string().uuid(),
  attemptNumber: z.number(),
  traceId: z.string().optional(),
  startTime: z.number(),
  timeoutMs: z.number(),
  metadata: z.record(z.any()).optional(),
})

export type JobExecutionContext = z.infer<typeof JobExecutionContextSchema>

// Queue response types
export interface QueueResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  metadata?: Record<string, any>
}

export interface EnqueueJobResponse
  extends QueueResponse<{
    messageId: string
    queueName: string
    scheduledAt: number
  }> {}

export interface DequeueJobResponse
  extends QueueResponse<{
    message?: JobQueueMessage
    queueSize: number
  }> {}

export interface GetQueueStatsResponse
  extends QueueResponse<{
    stats: QueueStats[]
  }> {}

export interface GetQueueHealthResponse
  extends QueueResponse<{
    healthChecks: QueueHealthCheck[]
  }> {}

// Cloudflare Queue integration types
export interface CloudflareQueueConfig {
  binding: string
  queue: string
  deadLetterQueue?: string
  maxRetries?: number
  maxMessageBytes?: number
  delaySeconds?: number
  batchSize?: number
  maxBatchSize?: number
  maxWaitTimeMs?: number
}

export interface CloudflareQueueProducer {
  binding: string
  queue: string
}

export interface CloudflareQueueConsumer {
  queue: string
  maxBatchSize?: number
  maxWaitTimeMs?: number
  deadLetterQueue?: string
}

// Queue monitoring and alerting types
export const QueueAlertConfigSchema = z.object({
  enabled: z.boolean().default(true),
  queueDepthThreshold: z.number().default(1000),
  errorRateThreshold: z.number().default(10),
  processingTimeThreshold: z.number().default(300000),
  deadLetterThreshold: z.number().default(100),
  noProcessingAlertThreshold: z.number().default(300000),
  webhookUrl: z.string().optional(),
  emailRecipients: z.array(z.string()).optional(),
  slackWebhookUrl: z.string().optional(),
})

export type QueueAlertConfig = z.infer<typeof QueueAlertConfigSchema>

// Queue analytics types
export const QueueAnalyticsSchema = z.object({
  period: z.object({
    start: z.number(),
    end: z.number(),
  }),
  summary: z.object({
    totalJobs: z.number(),
    successRate: z.number(),
    errorRate: z.number(),
    avgProcessingTime: z.number(),
    avgWaitTime: z.number(),
    throughputPerMinute: z.number(),
    peakQueueDepth: z.number(),
    avgQueueDepth: z.number(),
  }),
  trends: z.object({
    processingTime: z.enum(['improving', 'degrading', 'stable']),
    throughput: z.enum(['increasing', 'decreasing', 'stable']),
    errorRate: z.enum(['improving', 'degrading', 'stable']),
    queueDepth: z.enum(['increasing', 'decreasing', 'stable']),
  }),
  breakdown: z.object({
    byPriority: z.record(
      z.object({
        jobs: z.number(),
        avgProcessingTime: z.number(),
        successRate: z.number(),
      })
    ),
    byHour: z.array(
      z.object({
        hour: z.number(),
        jobs: z.number(),
        avgProcessingTime: z.number(),
        successRate: z.number(),
      })
    ),
  }),
})

export type QueueAnalytics = z.infer<typeof QueueAnalyticsSchema>

// Queue management types
export interface QueueManagementOptions {
  pauseQueue?: boolean
  drainQueue?: boolean
  clearQueue?: boolean
  requeueDeadLetterJobs?: boolean
  maxRequeueCount?: number
  forceRetry?: boolean
}

export interface QueueMaintenanceResult {
  success: boolean
  messagesProcessed: number
  messagesRequeued: number
  messagesDeleted: number
  errors: string[]
}

// Queue performance metrics
export const QueuePerformanceMetricsSchema = z.object({
  timestamp: z.number(),
  queueName: z.string(),
  latency: z.object({
    min: z.number(),
    max: z.number(),
    avg: z.number(),
    p50: z.number(),
    p95: z.number(),
    p99: z.number(),
  }),
  throughput: z.object({
    messagesPerSecond: z.number(),
    jobsPerMinute: z.number(),
  }),
  errors: z.object({
    count: z.number(),
    rate: z.number(),
    types: z.record(z.number()),
  }),
  resources: z.object({
    memoryUsage: z.number(),
    cpuUsage: z.number(),
    activeConnections: z.number(),
  }),
})

export type QueuePerformanceMetrics = z.infer<typeof QueuePerformanceMetricsSchema>

// Queue batch processing types
export interface BatchJobConfig {
  batchSize: number
  maxWaitTimeMs: number
  maxRetries: number
  enablePartialSuccess: boolean
  continueOnError: boolean
}

export interface BatchJobResult {
  jobId: string
  success: boolean
  result?: any
  error?: string
  processingTimeMs: number
}

export interface BatchJobSummary {
  batchId: string
  totalJobs: number
  successfulJobs: number
  failedJobs: number
  successRate: number
  totalProcessingTimeMs: number
  avgProcessingTimeMs: number
  results: BatchJobResult[]
}

// Export all types
export type { Job, JobPriority, JobStatus }

// Utility types
export type QueueProcessorFactory = (config: any) => QueueProcessor
export type QueueEventHandler = (event: QueueEvent) => Promise<void>
export type QueueMetricsCollector = (queueName: string, metrics: any) => Promise<void>

// Error types
export class QueueError extends Error {
  constructor(
    message: string,
    public code: string,
    public queueName?: string,
    public jobId?: string,
    public retryable: boolean = true
  ) {
    super(message)
    this.name = 'QueueError'
  }
}

export class QueueFullError extends QueueError {
  constructor(queueName: string, currentSize: number, maxSize: number) {
    super(
      `Queue ${queueName} is full (${currentSize}/${maxSize})`,
      'QUEUE_FULL',
      queueName,
      undefined,
      true
    )
    this.name = 'QueueFullError'
  }
}

export class JobTimeoutError extends QueueError {
  constructor(jobId: string, timeoutMs: number) {
    super(`Job ${jobId} timed out after ${timeoutMs}ms`, 'JOB_TIMEOUT', undefined, jobId, true)
    this.name = 'JobTimeoutError'
  }
}

export class MaxRetriesExceededError extends QueueError {
  constructor(jobId: string, maxRetries: number) {
    super(
      `Job ${jobId} exceeded maximum retries (${maxRetries})`,
      'MAX_RETRIES_EXCEEDED',
      undefined,
      jobId,
      false
    )
    this.name = 'MaxRetriesExceededError'
  }
}

export class QueueProcessingError extends QueueError {
  constructor(message: string, queueName?: string, jobId?: string) {
    super(message, 'QUEUE_PROCESSING_ERROR', queueName, jobId, true)
    this.name = 'QueueProcessingError'
  }
}
