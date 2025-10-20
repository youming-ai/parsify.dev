import { z } from 'zod'

// Job status
export const JobStatusSchema = z.enum(['pending', 'running', 'completed', 'failed'])
export type JobStatus = z.infer<typeof JobStatusSchema>

// Job schema for validation
export const JobSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  tool_id: z.string().uuid(),
  status: JobStatusSchema.default('pending'),
  input_data: z.record(z.any()).nullable(),
  output_data: z.record(z.any()).nullable(),
  input_ref: z.string().nullable(),
  output_ref: z.string().nullable(),
  progress: z.number().min(0).max(100).default(0),
  error_message: z.string().nullable(),
  retry_count: z.number().min(0).default(0),
  started_at: z.number().nullable(),
  completed_at: z.number().nullable(),
  created_at: z.number(),
  updated_at: z.number()
})

export type Job = z.infer<typeof JobSchema>

// Job creation schema
export const CreateJobSchema = JobSchema.partial({
  id: true,
  status: true,
  progress: true,
  error_message: true,
  retry_count: true,
  started_at: true,
  completed_at: true,
  created_at: true,
  updated_at: true
})

export type CreateJob = z.infer<typeof CreateJobSchema>

// Job update schema
export const UpdateJobSchema = JobSchema.partial({
  id: true,
  user_id: true,
  tool_id: true,
  created_at: true
})

export type UpdateJob = z.infer<typeof UpdateJobSchema>

// Job priority
export const JobPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent'])
export type JobPriority = z.infer<typeof JobPrioritySchema>

// Job queue info
export const JobQueueSchema = z.object({
  priority: JobPrioritySchema.default('normal'),
  max_retries: z.number().min(0).max(10).default(3),
  timeout_ms: z.number().min(1000).default(30000),
  delay_ms: z.number().min(0).default(0)
})

export type JobQueue = z.infer<typeof JobQueueSchema>

// Job model class
export class Job {
  public id: string
  public user_id: string | null
  public tool_id: string
  public status: JobStatus
  public input_data: Record<string, any> | null
  public output_data: Record<string, any> | null
  public input_ref: string | null
  public output_ref: string | null
  public progress: number
  public error_message: string | null
  public retry_count: number
  public started_at: number | null
  public completed_at: number | null
  public created_at: number
  public updated_at: number

  constructor(data: Job) {
    this.id = data.id
    this.user_id = data.user_id
    this.tool_id = data.tool_id
    this.status = data.status
    this.input_data = data.input_data
    this.output_data = data.output_data
    this.input_ref = data.input_ref
    this.output_ref = data.output_ref
    this.progress = data.progress
    this.error_message = data.error_message
    this.retry_count = data.retry_count
    this.started_at = data.started_at
    this.completed_at = data.completed_at
    this.created_at = data.created_at
    this.updated_at = data.updated_at
  }

  // Static methods for database operations
  static create(data: CreateJob): Job {
    const now = Math.floor(Date.now() / 1000)
    return new Job({
      id: crypto.randomUUID(),
      status: 'pending',
      progress: 0,
      retry_count: 0,
      started_at: null,
      completed_at: null,
      created_at: now,
      updated_at: now,
      ...data
    })
  }

  static fromRow(row: any): Job {
    return new Job(JobSchema.parse({
      ...row,
      input_data: row.input_data ? JSON.parse(row.input_data) : null,
      output_data: row.output_data ? JSON.parse(row.output_data) : null
    }))
  }

  toRow(): Record<string, any> {
    return {
      id: this.id,
      user_id: this.user_id,
      tool_id: this.tool_id,
      status: this.status,
      input_data: this.input_data ? JSON.stringify(this.input_data) : null,
      output_data: this.output_data ? JSON.stringify(this.output_data) : null,
      input_ref: this.input_ref,
      output_ref: this.output_ref,
      progress: this.progress,
      error_message: this.error_message,
      retry_count: this.retry_count,
      started_at: this.started_at,
      completed_at: this.completed_at,
      created_at: this.created_at,
      updated_at: this.updated_at
    }
  }

  update(data: UpdateJob): Job {
    return new Job({
      ...this,
      ...data,
      updated_at: Math.floor(Date.now() / 1000)
    })
  }

  // Job lifecycle methods
  start(): Job {
    return this.update({
      status: 'running',
      started_at: Math.floor(Date.now() / 1000),
      progress: 0
    })
  }

  complete(outputData?: Record<string, any>, outputRef?: string): Job {
    return this.update({
      status: 'completed',
      output_data: outputData || null,
      output_ref: outputRef || null,
      progress: 100,
      completed_at: Math.floor(Date.now() / 1000),
      error_message: null
    })
  }

  fail(errorMessage: string, retryCount?: number): Job {
    const newRetryCount = retryCount !== undefined ? retryCount : this.retry_count + 1
    return this.update({
      status: 'failed',
      error_message: errorMessage,
      retry_count: newRetryCount,
      completed_at: Math.floor(Date.now() / 1000)
    })
  }

  retry(): Job {
    return this.update({
      status: 'pending',
      error_message: null,
      started_at: null,
      completed_at: null,
      progress: 0
    })
  }

  updateProgress(progress: number): Job {
    return this.update({
      progress: Math.max(0, Math.min(100, progress))
    })
  }

  setTimeout(): Job {
    return this.fail('Job timeout', this.retry_count)
  }

  // Helper methods
  get isPending(): boolean {
    return this.status === 'pending'
  }

  get isRunning(): boolean {
    return this.status === 'running'
  }

  get isCompleted(): boolean {
    return this.status === 'completed'
  }

  get isFailed(): boolean {
    return this.status === 'failed'
  }

  get isFinished(): boolean {
    return this.status === 'completed' || this.status === 'failed'
  }

  get canRetry(): boolean {
    return this.isFailed && this.retry_count < 3 // Default max retries
  }

  get duration(): number | null {
    if (!this.started_at) return null
    const end = this.completed_at || Math.floor(Date.now() / 1000)
    return end - this.started_at
  }

  get durationString(): string {
    const duration = this.duration
    if (!duration) return 'N/A'

    const seconds = duration % 60
    const minutes = Math.floor(duration / 60) % 60
    const hours = Math.floor(duration / 3600)

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  get progressString(): string {
    return `${this.progress}%`
  }

  // Factory methods
  static createForTool(
    toolId: string,
    userId: string | null,
    inputData: Record<string, any>,
    inputRef?: string
  ): Job {
    return Job.create({
      user_id: userId,
      tool_id: toolId,
      input_data: inputData,
      input_ref: inputRef || null
    })
  }

  static createWithPriority(
    toolId: string,
    userId: string | null,
    inputData: Record<string, any>,
    priority: JobPriority = 'normal'
  ): Job {
    const job = Job.createForTool(toolId, userId, inputData)
    // Priority could be stored in input_data for queue processing
    if (priority !== 'normal') {
      job.input_data = { ...job.input_data, _priority: priority }
    }
    return job
  }
}

// SQL queries
export const JOB_QUERIES = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      tool_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      input_data TEXT,
      output_data TEXT,
      input_ref TEXT,
      output_ref TEXT,
      progress INTEGER DEFAULT 0,
      error_message TEXT,
      retry_count INTEGER DEFAULT 0,
      started_at INTEGER,
      completed_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (tool_id) REFERENCES tools(id)
    );
  `,

  CREATE_INDEXES: [
    'CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);',
    'CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);',
    'CREATE INDEX IF NOT EXISTS idx_jobs_tool_id ON jobs(tool_id);',
    'CREATE INDEX IF NOT EXISTS idx_jobs_pending ON jobs(status, created_at) WHERE status = \'pending\';',
    'CREATE INDEX IF NOT EXISTS idx_jobs_running ON jobs(status, started_at) WHERE status = \'running\';'
  ],

  INSERT: `
    INSERT INTO jobs (id, user_id, tool_id, status, input_data, output_data, input_ref, output_ref, progress, error_message, retry_count, started_at, completed_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `,

  SELECT_BY_ID: `
    SELECT * FROM jobs WHERE id = ?;
  `,

  SELECT_BY_USER: `
    SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?;
  `,

  SELECT_BY_USER_AND_STATUS: `
    SELECT * FROM jobs WHERE user_id = ? AND status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?;
  `,

  SELECT_BY_STATUS: `
    SELECT * FROM jobs WHERE status = ? ORDER BY created_at ASC LIMIT ?;
  `,

  SELECT_PENDING_JOBS: `
    SELECT * FROM jobs
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT ?;
  `,

  SELECT_RUNNING_JOBS: `
    SELECT * FROM jobs
    WHERE status = 'running'
    ORDER BY started_at ASC;
  `,

  SELECT_STALE_RUNNING_JOBS: `
    SELECT * FROM jobs
    WHERE status = 'running' AND started_at < ?
    ORDER BY started_at ASC;
  `,

  SELECT_BY_TOOL: `
    SELECT * FROM jobs WHERE tool_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?;
  `,

  SELECT_BY_DATE_RANGE: `
    SELECT * FROM jobs
    WHERE created_at >= ? AND created_at <= ?
    ORDER BY created_at DESC;
  `,

  UPDATE: `
    UPDATE jobs
    SET status = ?, input_data = ?, output_data = ?, input_ref = ?, output_ref = ?, progress = ?, error_message = ?, retry_count = ?, started_at = ?, completed_at = ?, updated_at = ?
    WHERE id = ?;
  `,

  DELETE: `
    DELETE FROM jobs WHERE id = ?;
  `,

  COUNT: `
    SELECT COUNT(*) as count FROM jobs;
  `,

  COUNT_BY_USER: `
    SELECT COUNT(*) as count FROM jobs WHERE user_id = ?;
  `,

  COUNT_BY_STATUS: `
    SELECT COUNT(*) as count FROM jobs WHERE status = ?;
  `,

  COUNT_BY_TOOL: `
    SELECT COUNT(*) as count FROM jobs WHERE tool_id = ?;
  `,

  // Cleanup queries
  DELETE_COMPLETED_JOBS: `
    DELETE FROM jobs WHERE status = 'completed' AND completed_at < ?;
  `,

  DELETE_FAILED_JOBS: `
    DELETE FROM jobs WHERE status = 'failed' AND completed_at < ?;
  `,

  // Analytics queries
  JOB_STATS: `
    SELECT
      status,
      COUNT(*) as count,
      AVG(CASE WHEN completed_at IS NOT NULL AND started_at IS NOT NULL THEN (completed_at - started_at) END) as avg_duration,
      AVG(retry_count) as avg_retries
    FROM jobs
    WHERE created_at >= ?
    GROUP BY status;
  `,

  THROUGHPUT_ANALYTICS: `
    SELECT
      DATE(created_at, 'unixepoch') as date,
      COUNT(*) as total_jobs,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_jobs,
      COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_jobs,
      AVG(CASE WHEN completed_at IS NOT NULL AND started_at IS NOT NULL THEN (completed_at - started_at) END) as avg_duration_ms
    FROM jobs
    WHERE created_at >= ?
    GROUP BY DATE(created_at, 'unixepoch')
    ORDER BY date DESC;
  `
} as const