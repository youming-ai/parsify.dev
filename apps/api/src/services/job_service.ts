import { createDatabaseClient, type DatabaseClient } from '../database'
import { AUDIT_LOG_QUERIES, AuditLog } from '../models/audit_log'
import { JOB_QUERIES, Job, UpdateJobSchema } from '../models/job'
import { TOOL_QUERIES, Tool } from '../models/tool'

export interface JobServiceOptions {
  db: D1Database
  kv: KVNamespace
  auditEnabled?: boolean
  maxConcurrentJobs?: number
  jobTimeoutMinutes?: number
  databaseConfig?: {
    maxConnections?: number
    connectionTimeoutMs?: number
    retryAttempts?: number
    enableMetrics?: boolean
  }
}

export interface JobCreationOptions {
  toolId: string
  userId?: string
  inputData: Record<string, any>
  inputRef?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  timeout?: number
  delay?: number
}

export interface JobFilter {
  userId?: string
  toolId?: string
  status?: 'pending' | 'running' | 'completed' | 'failed'
  dateFrom?: number
  dateTo?: number
  limit?: number
  offset?: number
}

export interface JobStats {
  totalJobs: number
  pendingJobs: number
  runningJobs: number
  completedJobs: number
  failedJobs: number
  avgExecutionTime: number
  successRate: number
}

export interface JobProgress {
  jobId: string
  progress: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  message?: string
  output?: any
  error?: string
}

export class JobService {
  private db: D1Database
  private client: DatabaseClient
  private kv: KVNamespace
  private auditEnabled: boolean
  private maxConcurrentJobs: number
  private jobTimeoutMinutes: number

  constructor(options: JobServiceOptions) {
    this.db = options.db
    this.client = createDatabaseClient(this.db, options.databaseConfig)
    this.kv = options.kv
    this.auditEnabled = options.auditEnabled ?? true
    this.maxConcurrentJobs = options.maxConcurrentJobs ?? 10
    this.jobTimeoutMinutes = options.jobTimeoutMinutes ?? 5
  }

  // Job CRUD operations
  async createJob(options: JobCreationOptions): Promise<Job> {
    // Validate tool exists
    const tool = await this.getToolById(options.toolId)
    if (!tool) {
      throw new Error(`Tool with ID ${options.toolId} not found`)
    }

    const job = Job.createForTool(
      options.toolId,
      options.userId,
      options.inputData,
      options.inputRef
    )

    // Apply priority settings
    if (options.priority && options.priority !== 'normal') {
      job.input_data = { ...job.input_data, _priority: options.priority }
    }

    // Apply delay
    if (options.delay && options.delay > 0) {
      job.created_at = Math.floor(Date.now() / 1000) + options.delay
      job.updated_at = job.created_at
    }

    try {
      await this.client.execute(JOB_QUERIES.INSERT, [
        job.id,
        job.user_id,
        job.tool_id,
        job.status,
        job.input_data ? JSON.stringify(job.input_data) : null,
        job.output_data ? JSON.stringify(job.output_data) : null,
        job.input_ref,
        job.output_ref,
        job.progress,
        job.error_message,
        job.retry_count,
        job.started_at,
        job.completed_at,
        job.created_at,
        job.updated_at,
      ])

      // Add to job queue
      await this.addToQueue(job)

      // Log audit event
      if (this.auditEnabled) {
        await this.logAudit({
          action: 'job_create',
          resource_type: 'job',
          resource_id: job.id,
          new_values: {
            tool_id: job.tool_id,
            status: job.status,
          },
          ipAddress: 'system',
          userAgent: 'job-service',
        })
      }

      return job
    } catch (error) {
      throw new Error(`Failed to create job: ${error}`)
    }
  }

  async getJobById(jobId: string): Promise<Job | null> {
    try {
      const result = await this.client.queryFirst(JOB_QUERIES.SELECT_BY_ID, [jobId])

      if (!result) {
        return null
      }

      return Job.fromRow(result)
    } catch (error) {
      throw new Error(`Failed to get job: ${error}`)
    }
  }

  async updateJob(jobId: string, updates: Partial<UpdateJobSchema>): Promise<Job> {
    const existingJob = await this.getJobById(jobId)
    if (!existingJob) {
      throw new Error(`Job with ID ${jobId} not found`)
    }

    const validatedData = UpdateJobSchema.parse(updates)
    const updatedJob = existingJob.update(validatedData)

    try {
      await this.client.execute(JOB_QUERIES.UPDATE, [
        updatedJob.status,
        updatedJob.input_data ? JSON.stringify(updatedJob.input_data) : null,
        updatedJob.output_data ? JSON.stringify(updatedJob.output_data) : null,
        updatedJob.input_ref,
        updatedJob.output_ref,
        updatedJob.progress,
        updatedJob.error_message,
        updatedJob.retry_count,
        updatedJob.started_at,
        updatedJob.completed_at,
        updatedJob.updated_at,
        updatedJob.id,
      ])

      return updatedJob
    } catch (error) {
      throw new Error(`Failed to update job: ${error}`)
    }
  }

  async deleteJob(jobId: string): Promise<void> {
    const existingJob = await this.getJobById(jobId)
    if (!existingJob) {
      throw new Error(`Job with ID ${jobId} not found`)
    }

    try {
      await this.client.execute(JOB_QUERIES.DELETE, [jobId])

      // Remove from queue
      await this.removeFromQueue(jobId)

      // Log audit event
      if (this.auditEnabled) {
        await this.logAudit({
          action: 'data_delete',
          resource_type: 'job',
          resource_id: jobId,
          old_values: { status: existingJob.status },
          ipAddress: 'system',
          userAgent: 'job-service',
        })
      }
    } catch (error) {
      throw new Error(`Failed to delete job: ${error}`)
    }
  }

  // Job listing and filtering
  async getJobs(filter: JobFilter = {}): Promise<Job[]> {
    try {
      let stmt: D1PreparedStatement
      let result: D1Result<any>

      if (filter.userId && filter.status) {
        stmt = this.db.prepare(JOB_QUERIES.SELECT_BY_USER_AND_STATUS)
        result = await stmt
          .bind(filter.userId, filter.status, filter.limit || 50, filter.offset || 0)
          .all()
      } else if (filter.userId) {
        stmt = this.db.prepare(JOB_QUERIES.SELECT_BY_USER)
        result = await stmt.bind(filter.userId, filter.limit || 50, filter.offset || 0).all()
      } else if (filter.status) {
        stmt = this.db.prepare(JOB_QUERIES.SELECT_BY_STATUS)
        result = await stmt.bind(filter.status, filter.limit || 50).all()
      } else if (filter.toolId) {
        stmt = this.db.prepare(JOB_QUERIES.SELECT_BY_TOOL)
        result = await stmt.bind(filter.toolId, filter.limit || 50, filter.offset || 0).all()
      } else if (filter.dateFrom && filter.dateTo) {
        stmt = this.db.prepare(JOB_QUERIES.SELECT_BY_DATE_RANGE)
        result = await stmt.bind(filter.dateFrom, filter.dateTo).all()
      } else {
        stmt = this.db.prepare(JOB_QUERIES.SELECT_RECENT)
        result = await stmt.bind(filter.limit || 50).all()
      }

      return result.results.map(row => Job.fromRow(row))
    } catch (error) {
      throw new Error(`Failed to get jobs: ${error}`)
    }
  }

  async getJobsByUser(userId: string, limit = 50, offset = 0): Promise<Job[]> {
    try {
      const stmt = this.db.prepare(JOB_QUERIES.SELECT_BY_USER)
      const result = await stmt.bind(userId, limit, offset).all()

      return result.results.map(row => Job.fromRow(row))
    } catch (error) {
      throw new Error(`Failed to get jobs by user: ${error}`)
    }
  }

  // Job queue management
  async getNextJobs(limit = 5): Promise<Job[]> {
    try {
      const stmt = this.db.prepare(JOB_QUERIES.SELECT_PENDING_JOBS)
      const result = await stmt.bind(limit).all()

      return result.results.map(row => Job.fromRow(row))
    } catch (error) {
      throw new Error(`Failed to get next jobs: ${error}`)
    }
  }

  async getRunningJobs(): Promise<Job[]> {
    try {
      const stmt = this.db.prepare(JOB_QUERIES.SELECT_RUNNING_JOBS)
      const result = await stmt.all()

      return result.results.map(row => Job.fromRow(row))
    } catch (error) {
      throw new Error(`Failed to get running jobs: ${error}`)
    }
  }

  async getStaleJobs(): Promise<Job[]> {
    const staleTime = Math.floor(Date.now() / 1000) - this.jobTimeoutMinutes * 60

    try {
      const stmt = this.db.prepare(JOB_QUERIES.SELECT_STALE_RUNNING_JOBS)
      const result = await stmt.bind(staleTime).all()

      return result.results.map(row => Job.fromRow(row))
    } catch (error) {
      throw new Error(`Failed to get stale jobs: ${error}`)
    }
  }

  // Job execution management
  async startJob(jobId: string): Promise<Job> {
    const job = await this.getJobById(jobId)
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`)
    }

    if (!job.isPending) {
      throw new Error(`Job ${jobId} is not in pending state`)
    }

    const startedJob = job.start()

    try {
      await this.updateJob(jobId, {
        status: startedJob.status,
        started_at: startedJob.started_at,
        progress: startedJob.progress,
      })

      // Remove from queue since it's now running
      await this.removeFromQueue(jobId)

      return startedJob
    } catch (error) {
      throw new Error(`Failed to start job: ${error}`)
    }
  }

  async completeJob(
    jobId: string,
    outputData?: Record<string, any>,
    outputRef?: string
  ): Promise<Job> {
    const job = await this.getJobById(jobId)
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`)
    }

    if (!job.isRunning) {
      throw new Error(`Job ${jobId} is not in running state`)
    }

    const completedJob = job.complete(outputData, outputRef)

    try {
      await this.updateJob(jobId, {
        status: completedJob.status,
        output_data: completedJob.output_data,
        output_ref: completedJob.output_ref,
        progress: completedJob.progress,
        completed_at: completedJob.completed_at,
        error_message: completedJob.error_message,
      })

      // Log completion
      if (this.auditEnabled) {
        await this.logAudit({
          action: 'job_complete',
          resource_type: 'job',
          resource_id: jobId,
          new_values: { status: 'completed', duration: completedJob.duration },
          ipAddress: 'system',
          userAgent: 'job-service',
        })
      }

      return completedJob
    } catch (error) {
      throw new Error(`Failed to complete job: ${error}`)
    }
  }

  async failJob(jobId: string, errorMessage: string): Promise<Job> {
    const job = await this.getJobById(jobId)
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`)
    }

    const failedJob = job.fail(errorMessage)

    try {
      await this.updateJob(jobId, {
        status: failedJob.status,
        error_message: failedJob.error_message,
        retry_count: failedJob.retry_count,
        completed_at: failedJob.completed_at,
      })

      // Log failure
      if (this.auditEnabled) {
        await this.logAudit({
          action: 'job_fail',
          resource_type: 'job',
          resource_id: jobId,
          new_values: {
            error: errorMessage,
            retry_count: failedJob.retry_count,
          },
          ipAddress: 'system',
          userAgent: 'job-service',
        })
      }

      return failedJob
    } catch (error) {
      throw new Error(`Failed to fail job: ${error}`)
    }
  }

  async retryJob(jobId: string): Promise<Job> {
    const job = await this.getJobById(jobId)
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`)
    }

    if (!job.canRetry) {
      throw new Error(`Job ${jobId} cannot be retried`)
    }

    const retriedJob = job.retry()

    try {
      await this.updateJob(jobId, {
        status: retriedJob.status,
        error_message: retriedJob.error_message,
        started_at: retriedJob.started_at,
        completed_at: retriedJob.completed_at,
        progress: retriedJob.progress,
      })

      // Add back to queue
      await this.addToQueue(retriedJob)

      return retriedJob
    } catch (error) {
      throw new Error(`Failed to retry job: ${error}`)
    }
  }

  async updateJobProgress(jobId: string, progress: number, message?: string): Promise<Job> {
    const job = await this.getJobById(jobId)
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`)
    }

    const updatedJob = job.updateProgress(progress)

    try {
      await this.updateJob(jobId, {
        progress: updatedJob.progress,
      })

      // Store progress in KV for real-time updates
      await this.kv.put(
        `job_progress:${jobId}`,
        JSON.stringify({
          progress,
          message,
          status: updatedJob.status,
          timestamp: Date.now(),
        }),
        { expirationTtl: 3600 }
      )

      return updatedJob
    } catch (error) {
      throw new Error(`Failed to update job progress: ${error}`)
    }
  }

  async getJobProgress(jobId: string): Promise<JobProgress | null> {
    try {
      // Try to get from KV first (real-time progress)
      const progressData = await this.kv.get(`job_progress:${jobId}`)
      if (progressData) {
        return JSON.parse(progressData)
      }

      // Fallback to database
      const job = await this.getJobById(jobId)
      if (!job) {
        return null
      }

      return {
        jobId: job.id,
        progress: job.progress,
        status: job.status,
        message: job.error_message || undefined,
      }
    } catch (error) {
      console.error('Failed to get job progress:', error)
      return null
    }
  }

  // Job statistics and analytics
  async getJobStats(filter: JobFilter = {}): Promise<JobStats> {
    try {
      let stmt: D1PreparedStatement
      let result: D1Result<any>

      if (filter.dateFrom && filter.dateTo) {
        stmt = this.db.prepare(JOB_QUERIES.JOB_STATS)
        result = await stmt.bind(filter.dateFrom).all()
      } else {
        // Default to last 7 days
        const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60
        stmt = this.db.prepare(JOB_QUERIES.JOB_STATS)
        result = await stmt.bind(sevenDaysAgo).all()
      }

      const stats = result.results[0]
      if (!stats) {
        return {
          totalJobs: 0,
          pendingJobs: 0,
          runningJobs: 0,
          completedJobs: 0,
          failedJobs: 0,
          avgExecutionTime: 0,
          successRate: 0,
        }
      }

      const totalJobs = parseInt(stats.total_jobs, 10)
      const successRate =
        totalJobs > 0 ? (parseInt(stats.successful_jobs, 10) / totalJobs) * 100 : 0

      return {
        totalJobs,
        pendingJobs: parseInt(stats.pending_jobs, 10),
        runningJobs: parseInt(stats.running_jobs, 10),
        completedJobs: parseInt(stats.successful_jobs, 10),
        failedJobs: parseInt(stats.failed_jobs, 10),
        avgExecutionTime: Math.round(parseFloat(stats.avg_duration) || 0),
        successRate: Math.round(successRate * 100) / 100,
      }
    } catch (error) {
      throw new Error(`Failed to get job stats: ${error}`)
    }
  }

  async getJobThroughput(
    days = 7
  ): Promise<Array<{ date: string; total: number; successful: number; failed: number }>> {
    try {
      const startDate = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60
      const stmt = this.db.prepare(JOB_QUERIES.THROUGHPUT_ANALYTICS)
      const result = await stmt.bind(startDate).all()

      return result.results.map(row => ({
        date: row.date,
        total: parseInt(row.total_jobs, 10),
        successful: parseInt(row.completed_jobs, 10),
        failed: parseInt(row.failed_jobs, 10),
      }))
    } catch (error) {
      throw new Error(`Failed to get job throughput: ${error}`)
    }
  }

  // Cleanup operations
  async cleanupOldJobs(olderThanDays = 30): Promise<number> {
    const cutoffTime = Math.floor(Date.now() / 1000) - olderThanDays * 24 * 60 * 60

    try {
      // Delete completed jobs
      const completedStmt = this.db.prepare(JOB_QUERIES.DELETE_COMPLETED_JOBS)
      const completedResult = await completedStmt.bind(cutoffTime).run()

      // Delete failed jobs
      const failedStmt = this.db.prepare(JOB_QUERIES.DELETE_FAILED_JOBS)
      const failedResult = await failedStmt.bind(cutoffTime).run()

      return (completedResult.changes || 0) + (failedResult.changes || 0)
    } catch (error) {
      throw new Error(`Failed to cleanup old jobs: ${error}`)
    }
  }

  // Private helper methods
  private async getToolById(toolId: string): Promise<Tool | null> {
    try {
      const stmt = this.db.prepare(TOOL_QUERIES.SELECT_BY_ID)
      const result = await stmt.bind(toolId).first()

      if (!result) {
        return null
      }

      return Tool.fromRow(result)
    } catch (error) {
      console.error('Failed to get tool:', error)
      return null
    }
  }

  private async addToQueue(job: Job): Promise<void> {
    try {
      const priority = job.input_data?._priority || 'normal'
      const queueKey = `job_queue:${priority}`
      const _score = job.created_at

      // Use KV sorted list emulation (in production, use proper queue service)
      await this.kv.put(
        `${queueKey}:${job.id}`,
        JSON.stringify({
          jobId: job.id,
          toolId: job.tool_id,
          userId: job.user_id,
          priority,
          createdAt: job.created_at,
        }),
        { expirationTtl: 3600 }
      )
    } catch (error) {
      console.error('Failed to add job to queue:', error)
    }
  }

  private async removeFromQueue(jobId: string): Promise<void> {
    try {
      // Try to remove from all priority queues
      const priorities = ['urgent', 'high', 'normal', 'low']
      for (const priority of priorities) {
        await this.kv.delete(`job_queue:${priority}:${jobId}`)
      }
    } catch (error) {
      console.error('Failed to remove job from queue:', error)
    }
  }

  private async logAudit(options: {
    action: string
    resource_type: string
    resource_id: string
    old_values?: Record<string, any>
    new_values?: Record<string, any>
    ipAddress?: string
    userAgent?: string
  }): Promise<void> {
    if (!this.auditEnabled) return

    try {
      const auditLog = AuditLog.create({
        user_id: undefined, // Job operations may be anonymous
        action: options.action as any,
        resource_type: options.resource_type as any,
        resource_id: options.resource_id,
        old_values: options.old_values || null,
        new_values: options.new_values || null,
        ip_address: options.ipAddress || null,
        user_agent: options.userAgent || null,
        success: true,
      })

      await this.client.execute(AUDIT_LOG_QUERIES.INSERT, [
        auditLog.id,
        auditLog.user_id,
        auditLog.action,
        auditLog.resource_type,
        auditLog.resource_id,
        auditLog.old_values ? JSON.stringify(auditLog.old_values) : null,
        auditLog.new_values ? JSON.stringify(auditLog.new_values) : null,
        auditLog.ip_address,
        auditLog.user_agent,
        auditLog.success,
        auditLog.error_message,
        auditLog.created_at,
      ])
    } catch (error) {
      console.error('Failed to log audit event:', error)
    }
  }

  // Job queue management
  async getQueueSize(): Promise<number> {
    try {
      const priorities = ['urgent', 'high', 'normal', 'low']
      let totalSize = 0

      for (const priority of priorities) {
        const list = await this.kv.list({ prefix: `job_queue:${priority}:` })
        totalSize += list.keys.length
      }

      return totalSize
    } catch (error) {
      console.error('Failed to get queue size:', error)
      return 0
    }
  }

  async processStaleJobs(): Promise<number> {
    const staleJobs = await this.getStaleJobs()
    let processedCount = 0

    for (const job of staleJobs) {
      try {
        await this.failJob(job.id, 'Job timed out')
        processedCount++
      } catch (error) {
        console.error(`Failed to process stale job ${job.id}:`, error)
      }
    }

    return processedCount
  }
}
