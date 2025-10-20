import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  Job,
  JobSchema,
  CreateJobSchema,
  UpdateJobSchema,
  JobStatusSchema,
  JobPrioritySchema,
  JOB_QUERIES
} from '../../../../apps/api/src/models/job'
import {
  createTestDatabase,
  createMockJob,
  setupTestEnvironment,
  cleanupTestEnvironment
} from './database.mock'

describe('Job Model', () => {
  let mockDb: any

  beforeEach(() => {
    setupTestEnvironment()
    mockDb = createTestDatabase()
  })

  afterEach(() => {
    cleanupTestEnvironment()
  })

  describe('Schema Validation', () => {
    it('should validate a complete job object', () => {
      const jobData = createMockJob()
      const result = JobSchema.safeParse(jobData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe(jobData.id)
        expect(result.data.user_id).toBe(jobData.user_id)
        expect(result.data.tool_id).toBe(jobData.tool_id)
        expect(result.data.status).toBe(jobData.status)
      }
    })

    it('should reject invalid status', () => {
      const invalidJob = createMockJob({ status: 'invalid' as any })
      const result = JobSchema.safeParse(invalidJob)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('status')
      }
    })

    it('should accept valid statuses', () => {
      const validStatuses = ['pending', 'running', 'completed', 'failed']

      validStatuses.forEach(status => {
        const job = createMockJob({ status: status as any })
        const result = JobSchema.safeParse(job)
        expect(result.success).toBe(true)
      })
    })

    it('should validate job creation schema', () => {
      const createData = {
        user_id: 'user-123',
        tool_id: 'tool-123',
        input_data: { test: 'data' },
        input_ref: 'ref-123'
      }

      const result = CreateJobSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })

    it('should validate job update schema', () => {
      const updateData = {
        status: 'completed' as const,
        output_data: { result: 'success' },
        progress: 100
      }

      const result = UpdateJobSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })
  })

  describe('Model Creation and Instantiation', () => {
    it('should create a job instance with valid data', () => {
      const jobData = createMockJob()
      const job = new Job(jobData)

      expect(job.id).toBe(jobData.id)
      expect(job.user_id).toBe(jobData.user_id)
      expect(job.tool_id).toBe(jobData.tool_id)
      expect(job.status).toBe(jobData.status)
      expect(job.progress).toBe(jobData.progress)
    })

    it('should create a job with static create method', () => {
      const createData = {
        user_id: 'user-456',
        tool_id: 'tool-456',
        input_data: { input: 'test' }
      }

      const job = Job.create(createData)

      expect(job.id).toBeDefined()
      expect(job.user_id).toBe(createData.user_id)
      expect(job.tool_id).toBe(createData.tool_id)
      expect(job.status).toBe('pending')
      expect(job.progress).toBe(0)
      expect(job.retry_count).toBe(0)
      expect(job.created_at).toBeDefined()
      expect(job.updated_at).toBeDefined()
    })

    it('should create job from database row', () => {
      const rowData = createMockJob()
      mockDb.setTableData('jobs', [rowData])

      const job = Job.fromRow(rowData)

      expect(job).toBeInstanceOf(Job)
      expect(job.id).toBe(rowData.id)
      expect(job.tool_id).toBe(rowData.tool_id)
    })

    it('should parse JSON input_data and output_data in fromRow', () => {
      const inputData = { test: 'input' }
      const outputData = { result: 'output' }
      const rowData = createMockJob({
        input_data: JSON.stringify(inputData),
        output_data: JSON.stringify(outputData)
      })

      const job = Job.fromRow(rowData)
      expect(job.input_data).toEqual(inputData)
      expect(job.output_data).toEqual(outputData)
    })

    it('should handle null input_data and output_data in fromRow', () => {
      const rowData = createMockJob({
        input_data: null,
        output_data: null
      })

      const job = Job.fromRow(rowData)
      expect(job.input_data).toBeNull()
      expect(job.output_data).toBeNull()
    })
  })

  describe('Factory Methods', () => {
    it('should create job for tool', () => {
      const job = Job.createForTool(
        'tool-123',
        'user-123',
        { input: 'test data' },
        'input-ref-123'
      )

      expect(job.tool_id).toBe('tool-123')
      expect(job.user_id).toBe('user-123')
      expect(job.input_data).toEqual({ input: 'test data' })
      expect(job.input_ref).toBe('input-ref-123')
      expect(job.status).toBe('pending')
    })

    it('should create job with priority', () => {
      const job = Job.createWithPriority(
        'tool-123',
        'user-123',
        { input: 'test data' },
        'high'
      )

      expect(job.input_data!._priority).toBe('high')
    })

    it('should create anonymous job', () => {
      const job = Job.createForTool(
        'tool-123',
        null,
        { input: 'test data' }
      )

      expect(job.user_id).toBeNull()
    })
  })

  describe('Database Operations', () => {
    it('should convert job to database row format', () => {
      const inputData = { test: 'input' }
      const outputData = { result: 'output' }
      const jobData = createMockJob({ input_data: inputData, output_data: outputData })
      const job = new Job(jobData)

      const row = job.toRow()

      expect(row.id).toBe(job.id)
      expect(row.user_id).toBe(job.user_id)
      expect(row.tool_id).toBe(job.tool_id)
      expect(row.input_data).toBe(JSON.stringify(inputData))
      expect(row.output_data).toBe(JSON.stringify(outputData))
    })

    it('should handle null data when converting to row', () => {
      const jobData = createMockJob({ input_data: null, output_data: null })
      const job = new Job(jobData)

      const row = job.toRow()
      expect(row.input_data).toBeNull()
      expect(row.output_data).toBeNull()
    })

    it('should update job data', () => {
      const jobData = createMockJob()
      const job = new Job(jobData)
      const originalUpdatedAt = job.updated_at

      setTimeout(() => {
        const updateData = {
          status: 'completed' as const,
          output_data: { result: 'success' }
        }

        const updatedJob = job.update(updateData)

        expect(updatedJob.status).toBe(updateData.status)
        expect(updatedJob.output_data).toEqual(updateData.output_data)
        expect(updatedJob.updated_at).toBeGreaterThan(originalUpdatedAt)
      }, 10)
    })
  })

  describe('Job Lifecycle Methods', () => {
    it('should start job correctly', () => {
      const jobData = createMockJob({ status: 'pending', started_at: null })
      const job = new Job(jobData)

      const startedJob = job.start()

      expect(startedJob.status).toBe('running')
      expect(startedJob.started_at).toBeGreaterThan(0)
      expect(startedJob.progress).toBe(0)
    })

    it('should complete job correctly', () => {
      const jobData = createMockJob({ status: 'running', output_data: null })
      const job = new Job(jobData)

      const outputData = { result: 'success' }
      const completedJob = job.complete(outputData, 'output-ref-123')

      expect(completedJob.status).toBe('completed')
      expect(completedJob.output_data).toEqual(outputData)
      expect(completedJob.output_ref).toBe('output-ref-123')
      expect(completedJob.progress).toBe(100)
      expect(completedJob.completed_at).toBeGreaterThan(0)
      expect(completedJob.error_message).toBeNull()
    })

    it('should fail job correctly', () => {
      const jobData = createMockJob({ status: 'running', retry_count: 0 })
      const job = new Job(jobData)

      const errorMessage = 'Something went wrong'
      const failedJob = job.fail(errorMessage)

      expect(failedJob.status).toBe('failed')
      expect(failedJob.error_message).toBe(errorMessage)
      expect(failedJob.retry_count).toBe(1)
      expect(failedJob.completed_at).toBeGreaterThan(0)
    })

    it('should fail job with custom retry count', () => {
      const jobData = createMockJob({ status: 'running', retry_count: 2 })
      const job = new Job(jobData)

      const errorMessage = 'Something went wrong'
      const failedJob = job.fail(errorMessage, 5)

      expect(failedJob.retry_count).toBe(5)
    })

    it('should retry job correctly', () => {
      const jobData = createMockJob({
        status: 'failed',
        error_message: 'Previous error',
        started_at: 12345,
        completed_at: 12350
      })
      const job = new Job(jobData)

      const retriedJob = job.retry()

      expect(retriedJob.status).toBe('pending')
      expect(retriedJob.error_message).toBeNull()
      expect(retriedJob.started_at).toBeNull()
      expect(retriedJob.completed_at).toBeNull()
      expect(retriedJob.progress).toBe(0)
    })

    it('should update progress correctly', () => {
      const jobData = createMockJob({ progress: 25 })
      const job = new Job(jobData)

      const progressJob = job.updateProgress(75)

      expect(progressJob.progress).toBe(75)
    })

    it('should clamp progress values', () => {
      const jobData = createMockJob({ progress: 50 })
      const job = new Job(jobData)

      const underMinJob = job.updateProgress(-10)
      const overMaxJob = job.updateProgress(150)

      expect(underMinJob.progress).toBe(0)
      expect(overMaxJob.progress).toBe(100)
    })

    it('should timeout job correctly', () => {
      const jobData = createMockJob({ status: 'running', retry_count: 1 })
      const job = new Job(jobData)

      const timeoutJob = job.setTimeout()

      expect(timeoutJob.status).toBe('failed')
      expect(timeoutJob.error_message).toBe('Job timeout')
      expect(timeoutJob.retry_count).toBe(1)
    })
  })

  describe('Helper Methods and Business Logic', () => {
    it('should correctly identify job states', () => {
      const pendingJob = new Job(createMockJob({ status: 'pending' }))
      const runningJob = new Job(createMockJob({ status: 'running' }))
      const completedJob = new Job(createMockJob({ status: 'completed' }))
      const failedJob = new Job(createMockJob({ status: 'failed' }))

      expect(pendingJob.isPending).toBe(true)
      expect(pendingJob.isRunning).toBe(false)
      expect(pendingJob.isCompleted).toBe(false)
      expect(pendingJob.isFailed).toBe(false)

      expect(runningJob.isPending).toBe(false)
      expect(runningJob.isRunning).toBe(true)
      expect(runningJob.isCompleted).toBe(false)
      expect(runningJob.isFailed).toBe(false)

      expect(completedJob.isPending).toBe(false)
      expect(completedJob.isRunning).toBe(false)
      expect(completedJob.isCompleted).toBe(true)
      expect(completedJob.isFailed).toBe(false)

      expect(failedJob.isPending).toBe(false)
      expect(failedJob.isRunning).toBe(false)
      expect(failedJob.isCompleted).toBe(false)
      expect(failedJob.isFailed).toBe(true)
    })

    it('should correctly identify finished jobs', () => {
      const runningJob = new Job(createMockJob({ status: 'running' }))
      const completedJob = new Job(createMockJob({ status: 'completed' }))
      const failedJob = new Job(createMockJob({ status: 'failed' }))

      expect(runningJob.isFinished).toBe(false)
      expect(completedJob.isFinished).toBe(true)
      expect(failedJob.isFinished).toBe(true)
    })

    it('should correctly determine if job can be retried', () => {
      const retryableJob = new Job(createMockJob({ status: 'failed', retry_count: 2 }))
      const nonRetryableJob = new Job(createMockJob({ status: 'failed', retry_count: 3 }))
      const runningJob = new Job(createMockJob({ status: 'running' }))

      expect(retryableJob.canRetry).toBe(true)
      expect(nonRetryableJob.canRetry).toBe(false)
      expect(runningJob.canRetry).toBe(false)
    })

    it('should calculate duration correctly', () => {
      const now = Math.floor(Date.now() / 1000)
      const startedJob = new Job(createMockJob({
        started_at: now - 100,
        completed_at: null
      }))
      const completedJob = new Job(createMockJob({
        started_at: now - 200,
        completed_at: now - 50
      }))
      const notStartedJob = new Job(createMockJob({
        started_at: null,
        completed_at: null
      }))

      expect(startedJob.duration).toBeGreaterThanOrEqual(100)
      expect(completedJob.duration).toBe(150)
      expect(notStartedJob.duration).toBeNull()
    })

    it('should format duration string correctly', () => {
      const job1 = new Job(createMockJob({
        started_at: 1000,
        completed_at: 1065 // 65 seconds
      }))
      const job2 = new Job(createMockJob({
        started_at: 1000,
        completed_at: 4000 // 50 minutes
      }))
      const job3 = new Job(createMockJob({
        started_at: 1000,
        completed_at: 10000 // 2.5 hours
      }))
      const job4 = new Job(createMockJob({
        started_at: null,
        completed_at: null
      }))

      expect(job1.durationString).toBe('1m 5s')
      expect(job2.durationString).toBe('50m 0s')
      expect(job3.durationString).toBe('2h 30m 0s')
      expect(job4.durationString).toBe('N/A')
    })

    it('should format progress string correctly', () => {
      const job1 = new Job(createMockJob({ progress: 0 }))
      const job2 = new Job(createMockJob({ progress: 50 }))
      const job3 = new Job(createMockJob({ progress: 100 }))

      expect(job1.progressString).toBe('0%')
      expect(job2.progressString).toBe('50%')
      expect(job3.progressString).toBe('100%')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing optional fields', () => {
      const minimalJobData = {
        id: 'job-123',
        user_id: null,
        tool_id: 'tool-123',
        status: 'pending',
        input_data: null,
        output_data: null,
        input_ref: null,
        output_ref: null,
        progress: 0,
        error_message: null,
        retry_count: 0,
        started_at: null,
        completed_at: null,
        created_at: 1234567890,
        updated_at: 1234567890
      }

      const job = new Job(minimalJobData)

      expect(job.user_id).toBeNull()
      expect(job.input_data).toBeNull()
      expect(job.output_data).toBeNull()
      expect(job.started_at).toBeNull()
      expect(job.completed_at).toBeNull()
    })

    it('should handle invalid data in fromRow', () => {
      const invalidRow = {
        id: 'invalid-uuid',
        user_id: 'invalid-uuid',
        tool_id: 'invalid-uuid',
        status: 'invalid',
        progress: -1
      }

      expect(() => Job.fromRow(invalidRow)).toThrow()
    })

    it('should handle malformed JSON in data fields', () => {
      const rowData = createMockJob({
        input_data: 'invalid json string',
        output_data: 'also invalid'
      })

      expect(() => Job.fromRow(rowData)).toThrow()
    })

    it('should handle empty data objects', () => {
      const jobData = createMockJob({
        input_data: {},
        output_data: {}
      })
      const job = new Job(jobData)

      expect(job.input_data).toEqual({})
      expect(job.output_data).toEqual({})
    })
  })

  describe('SQL Queries', () => {
    it('should have all required SQL queries', () => {
      expect(JOB_QUERIES.CREATE_TABLE).toBeDefined()
      expect(JOB_QUERIES.INSERT).toBeDefined()
      expect(JOB_QUERIES.SELECT_BY_ID).toBeDefined()
      expect(JOB_QUERIES.SELECT_BY_USER).toBeDefined()
      expect(JOB_QUERIES.SELECT_BY_USER_AND_STATUS).toBeDefined()
      expect(JOB_QUERIES.SELECT_BY_STATUS).toBeDefined()
      expect(JOB_QUERIES.SELECT_PENDING_JOBS).toBeDefined()
      expect(JOB_QUERIES.SELECT_RUNNING_JOBS).toBeDefined()
      expect(JOB_QUERIES.UPDATE).toBeDefined()
      expect(JOB_QUERIES.DELETE).toBeDefined()
      expect(JOB_QUERIES.JOB_STATS).toBeDefined()
    })

    it('should have proper table creation query', () => {
      expect(JOB_QUERIES.CREATE_TABLE).toContain('CREATE TABLE IF NOT EXISTS jobs')
      expect(JOB_QUERIES.CREATE_TABLE).toContain('id TEXT PRIMARY KEY')
      expect(JOB_QUERIES.CREATE_TABLE).toContain('FOREIGN KEY (user_id) REFERENCES users(id)')
      expect(JOB_QUERIES.CREATE_TABLE).toContain('FOREIGN KEY (tool_id) REFERENCES tools(id)')
    })

    it('should have proper index creation queries', () => {
      expect(JOB_QUERIES.CREATE_INDEXES).toHaveLength(6)
      expect(JOB_QUERIES.CREATE_INDEXES[0]).toContain('idx_jobs_user_id')
      expect(JOB_QUERIES.CREATE_INDEXES[1]).toContain('idx_jobs_status')
      expect(JOB_QUERIES.CREATE_INDEXES[2]).toContain('idx_jobs_created_at')
      expect(JOB_QUERIES.CREATE_INDEXES[3]).toContain('idx_jobs_tool_id')
      expect(JOB_QUERIES.CREATE_INDEXES[4]).toContain('idx_jobs_pending')
      expect(JOB_QUERIES.CREATE_INDEXES[5]).toContain('idx_jobs_running')
    })

    it('should have parameterized queries', () => {
      expect(JOB_QUERIES.INSERT).toContain('VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      expect(JOB_QUERIES.SELECT_BY_ID).toContain('WHERE id = ?')
      expect(JOB_QUERIES.SELECT_BY_USER).toContain('WHERE user_id = ?')
      expect(JOB_QUERIES.DELETE).toContain('WHERE id = ?')
    })
  })

  describe('Integration with Mock Database', () => {
    it('should work with mock database operations', async () => {
      const jobData = createMockJob()
      mockDb.setTableData('jobs', [jobData])

      // Test SELECT by ID
      const selectStmt = mockDb.prepare(JOB_QUERIES.SELECT_BY_ID).bind(jobData.id)
      const result = await selectStmt.first()

      expect(result).toEqual(jobData)
    })

    it('should handle job creation through mock database', async () => {
      const jobData = createMockJob()

      // Test INSERT
      const insertStmt = mockDb.prepare(JOB_QUERIES.INSERT).bind(
        jobData.id,
        jobData.user_id,
        jobData.tool_id,
        jobData.status,
        JSON.stringify(jobData.input_data),
        JSON.stringify(jobData.output_data),
        jobData.input_ref,
        jobData.output_ref,
        jobData.progress,
        jobData.error_message,
        jobData.retry_count,
        jobData.started_at,
        jobData.completed_at,
        jobData.created_at,
        jobData.updated_at
      )

      const result = await insertStmt.run()
      expect(result.success).toBe(true)
      expect(result.meta.changes).toBe(1)

      // Verify data was inserted
      const storedData = mockDb.getTableData('jobs')
      expect(storedData).toHaveLength(1)
      expect(storedData[0].id).toBe(jobData.id)
    })

    it('should handle job lookup by user and status', async () => {
      const jobData = createMockJob({ user_id: 'user-123', status: 'completed' })
      mockDb.setTableData('jobs', [jobData])

      // Test SELECT by user and status
      const selectStmt = mockDb.prepare(JOB_QUERIES.SELECT_BY_USER_AND_STATUS).bind(
        'user-123', 'completed', 10, 0
      )
      const result = await selectStmt.all()

      expect(result.results).toHaveLength(1)
      expect(result.results[0]).toEqual(jobData)
    })

    it('should handle pending jobs selection', async () => {
      const pendingJob = createMockJob({ status: 'pending' })
      const runningJob = createMockJob({ status: 'running' })
      mockDb.setTableData('jobs', [pendingJob, runningJob])

      // Test SELECT pending jobs
      const selectStmt = mockDb.prepare(JOB_QUERIES.SELECT_PENDING_JOBS).bind(10)
      const result = await selectStmt.all()

      expect(result.results).toHaveLength(1)
      expect(result.results[0].status).toBe('pending')
    })

    it('should handle job updates through mock database', async () => {
      const jobData = createMockJob()
      mockDb.setTableData('jobs', [jobData])

      const now = Math.floor(Date.now() / 1000)

      // Test UPDATE
      const updateStmt = mockDb.prepare(JOB_QUERIES.UPDATE).bind(
        'completed',
        JSON.stringify(jobData.input_data),
        JSON.stringify({ result: 'success' }),
        jobData.input_ref,
        'output-ref-123',
        100,
        null,
        jobData.retry_count,
        jobData.started_at,
        now,
        now,
        jobData.id
      )

      const result = await updateStmt.run()
      expect(result.success).toBe(true)
      expect(result.meta.changes).toBe(1)
    })

    it('should handle job deletion through mock database', async () => {
      const jobData = createMockJob()
      mockDb.setTableData('jobs', [jobData])

      // Test DELETE
      const deleteStmt = mockDb.prepare(JOB_QUERIES.DELETE).bind(jobData.id)
      const result = await deleteStmt.run()

      expect(result.success).toBe(true)
      expect(result.meta.changes).toBe(1)

      // Verify data was deleted
      const storedData = mockDb.getTableData('jobs')
      expect(storedData).toHaveLength(0)
    })
  })
})
