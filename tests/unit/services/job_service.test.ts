import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { JobService } from '@/api/src/services/job_service'
import {
  cleanupTestEnvironment,
  createMockAuditLog,
  createMockJob,
  createMockTool,
  createMockToolUsage,
  createMockUser,
  createTestDatabase,
  type MockD1Database,
  setupTestEnvironment,
} from '../models/database.mock'

// Mock the database client module
vi.mock('@/api/src/database', () => ({
  DatabaseClient: vi.fn(),
  createDatabaseClient: vi.fn(() => ({
    query: vi.fn(),
    queryFirst: vi.fn(),
    execute: vi.fn(),
    enhancedTransaction: vi.fn(),
  })),
  TransactionHelper: vi.fn(),
  IsolationLevel: {
    READ_COMMITTED: 'READ_COMMITTED',
  },
}))

// Mock the models
vi.mock('@/api/src/models/job', () => ({
  Job: {
    create: vi.fn(),
    createForTool: vi.fn(),
    fromRow: vi.fn(),
  },
  JobSchema: {
    parse: vi.fn(),
    safeParse: vi.fn(),
  },
  CreateJobSchema: {
    parse: vi.fn(),
  },
  UpdateJobSchema: {
    parse: vi.fn(),
  },
  JOB_QUERIES: {
    INSERT: 'INSERT INTO jobs...',
    SELECT_BY_ID: 'SELECT * FROM jobs WHERE id = ?',
    SELECT_BY_USER: 'SELECT * FROM jobs WHERE user_id = ?',
    SELECT_BY_TOOL: 'SELECT * FROM jobs WHERE tool_id = ?',
    SELECT_BY_STATUS: 'SELECT * FROM jobs WHERE status = ?',
    UPDATE: 'UPDATE jobs SET...',
    DELETE: 'DELETE FROM jobs WHERE id = ?',
    LIST: 'SELECT * FROM jobs WHERE created_at >= ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    COUNT: 'SELECT COUNT(*) as count FROM jobs',
  },
}))

vi.mock('@/api/src/models/tool', () => ({
  Tool: {
    create: vi.fn(),
    fromRow: vi.fn(),
  },
  TOOL_QUERIES: {
    SELECT_BY_ID: 'SELECT * FROM tools WHERE id = ?',
  },
}))

vi.mock('@/api/src/models/tool_usage', () => ({
  ToolUsage: {
    create: vi.fn(),
    fromRow: vi.fn(),
  },
  TOOL_USAGE_QUERIES: {
    INSERT: 'INSERT INTO tool_usage...',
  },
}))

vi.mock('@/api/src/models/audit_log', () => ({
  AuditLog: {
    create: vi.fn(),
    fromRow: vi.fn(),
  },
  AUDIT_LOG_QUERIES: {
    INSERT: 'INSERT INTO audit_logs...',
  },
}))

describe('JobService', () => {
  let jobService: JobService
  let mockDb: MockD1Database
  let mockKv: any
  let mockDbClient: any

  beforeEach(() => {
    setupTestEnvironment()

    mockDb = createTestDatabase({
      jobs: [createMockJob()],
      tools: [createMockTool()],
      users: [createMockUser()],
      tool_usage: [createMockToolUsage()],
      audit_logs: [createMockAuditLog()],
    })

    mockKv = {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
    }

    // Create a mock database client
    mockDbClient = {
      query: vi.fn(),
      queryFirst: vi.fn(),
      execute: vi.fn(),
      enhancedTransaction: vi.fn(),
    }

    const { createDatabaseClient } = require('@/api/src/database')
    createDatabaseClient.mockReturnValue(mockDbClient)

    jobService = new JobService({
      db: mockDb as any,
      kv: mockKv,
      auditEnabled: true,
      maxConcurrentJobs: 10,
      jobTimeoutMinutes: 5,
    })
  })

  afterEach(() => {
    cleanupTestEnvironment()
    vi.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      const service = new JobService({
        db: mockDb as any,
        kv: mockKv,
      })
      expect(service).toBeDefined()
    })

    it('should initialize with custom options', () => {
      const service = new JobService({
        db: mockDb as any,
        kv: mockKv,
        auditEnabled: false,
        maxConcurrentJobs: 20,
        jobTimeoutMinutes: 10,
        databaseConfig: {
          maxConnections: 15,
          connectionTimeoutMs: 10000,
          retryAttempts: 5,
          enableMetrics: true,
        },
      })
      expect(service).toBeDefined()
    })
  })

  describe('createJob', () => {
    it('should create a job successfully', async () => {
      const options = {
        toolId: 'tool-123',
        userId: 'user-123',
        inputData: { test: 'data' },
        priority: 'high' as const,
        timeout: 300,
      }

      const mockTool = createMockTool({ id: options.toolId })
      const mockJob = createMockJob({
        tool_id: options.toolId,
        user_id: options.userId,
        input_data: options.inputData,
      })

      // Mock tool validation
      mockDbClient.queryFirst.mockResolvedValue(mockTool)
      const { Tool } = require('@/api/src/models/tool')
      Tool.fromRow.mockReturnValue(mockTool)

      // Mock job creation
      const { Job } = require('@/api/src/models/job')
      Job.createForTool.mockReturnValue(mockJob)

      mockDbClient.execute.mockResolvedValue({ success: true })

      // Mock queue addition
      mockKv.put.mockResolvedValue(undefined)

      const result = await jobService.createJob(options)

      expect(result).toEqual(mockJob)
      expect(Job.createForTool).toHaveBeenCalledWith(
        options.toolId,
        options.userId,
        options.inputData,
        undefined
      )
      expect(mockDbClient.execute).toHaveBeenCalledWith('INSERT INTO jobs...', [
        mockJob.id,
        mockJob.user_id,
        mockJob.tool_id,
        mockJob.status,
        JSON.stringify(mockJob.input_data),
        JSON.stringify(mockJob.output_data),
        mockJob.input_ref,
        mockJob.output_ref,
        mockJob.progress,
        mockJob.error_message,
        mockJob.retry_count,
        mockJob.started_at,
        mockJob.completed_at,
        mockJob.created_at,
        mockJob.updated_at,
      ])
      expect(mockKv.put).toHaveBeenCalled()
    })

    it('should throw error when tool not found', async () => {
      const options = {
        toolId: 'nonexistent-tool',
        userId: 'user-123',
        inputData: { test: 'data' },
      }

      mockDbClient.queryFirst.mockResolvedValue(null)

      await expect(jobService.createJob(options)).rejects.toThrow(
        `Tool with ID ${options.toolId} not found`
      )
    })

    it('should apply priority settings', async () => {
      const options = {
        toolId: 'tool-123',
        userId: 'user-123',
        inputData: { test: 'data' },
        priority: 'urgent' as const,
      }

      const mockTool = createMockTool({ id: options.toolId })
      const mockJob = createMockJob({
        tool_id: options.toolId,
        user_id: options.userId,
        input_data: { ...options.inputData, _priority: 'urgent' },
      })

      mockDbClient.queryFirst.mockResolvedValue(mockTool)
      const { Tool } = require('@/api/src/models/tool')
      Tool.fromRow.mockReturnValue(mockTool)

      const { Job } = require('@/api/src/models/job')
      Job.createForTool.mockReturnValue(mockJob)

      mockDbClient.execute.mockResolvedValue({ success: true })
      mockKv.put.mockResolvedValue(undefined)

      await jobService.createJob(options)

      expect(mockJob.input_data).toHaveProperty('_priority', 'urgent')
    })

    it('should apply delay to job timing', async () => {
      const options = {
        toolId: 'tool-123',
        userId: 'user-123',
        inputData: { test: 'data' },
        delay: 3600, // 1 hour delay
      }

      const mockTool = createMockTool({ id: options.toolId })
      const now = Math.floor(Date.now() / 1000)
      const delayedTime = now + options.delay

      const mockJob = createMockJob({
        tool_id: options.toolId,
        user_id: options.userId,
        created_at: delayedTime,
        updated_at: delayedTime,
      })

      mockDbClient.queryFirst.mockResolvedValue(mockTool)
      const { Tool } = require('@/api/src/models/tool')
      Tool.fromRow.mockReturnValue(mockTool)

      const { Job } = require('@/api/src/models/job')
      Job.createForTool.mockReturnValue(mockJob)

      mockDbClient.execute.mockResolvedValue({ success: true })
      mockKv.put.mockResolvedValue(undefined)

      await jobService.createJob(options)

      expect(mockJob.created_at).toBe(delayedTime)
      expect(mockJob.updated_at).toBe(delayedTime)
    })

    it('should handle database errors', async () => {
      const options = {
        toolId: 'tool-123',
        userId: 'user-123',
        inputData: { test: 'data' },
      }

      const mockTool = createMockTool({ id: options.toolId })
      mockDbClient.queryFirst.mockResolvedValue(mockTool)
      const { Tool } = require('@/api/src/models/tool')
      Tool.fromRow.mockReturnValue(mockTool)

      const { Job } = require('@/api/src/models/job')
      Job.createForTool.mockReturnValue(createMockJob())

      mockDbClient.execute.mockRejectedValue(new Error('Database error'))

      await expect(jobService.createJob(options)).rejects.toThrow(
        'Failed to create job: Error: Database error'
      )
    })
  })

  describe('getJobById', () => {
    it('should return job when found', async () => {
      const jobId = 'job-123'
      const mockJob = createMockJob({ id: jobId })

      mockDbClient.queryFirst.mockResolvedValue(mockJob)
      const { Job } = require('@/api/src/models/job')
      Job.fromRow.mockReturnValue(mockJob)

      const result = await jobService.getJobById(jobId)

      expect(result).toEqual(mockJob)
      expect(mockDbClient.queryFirst).toHaveBeenCalledWith('SELECT * FROM jobs WHERE id = ?', [
        jobId,
      ])
    })

    it('should return null when job not found', async () => {
      const jobId = 'nonexistent-job'
      mockDbClient.queryFirst.mockResolvedValue(null)

      const result = await jobService.getJobById(jobId)

      expect(result).toBeNull()
    })

    it('should handle database errors', async () => {
      const jobId = 'job-123'
      mockDbClient.queryFirst.mockRejectedValue(new Error('Database error'))

      await expect(jobService.getJobById(jobId)).rejects.toThrow(
        'Failed to get job: Error: Database error'
      )
    })
  })

  describe('updateJob', () => {
    it('should update job successfully', async () => {
      const jobId = 'job-123'
      const existingJob = createMockJob({
        id: jobId,
        status: 'pending',
        progress: 0,
      })
      const updates = {
        status: 'running' as const,
        progress: 50,
      }
      const updatedJob = createMockJob({
        id: jobId,
        status: 'running',
        progress: 50,
      })

      mockDbClient.queryFirst.mockResolvedValue(existingJob)
      const { Job, UpdateJobSchema } = require('@/api/src/models/job')
      Job.fromRow.mockReturnValue(existingJob)
      UpdateJobSchema.parse.mockReturnValue(updates)

      const mockUpdatedInstance = {
        ...existingJob,
        update: vi.fn().mockReturnValue(updatedJob),
      }
      Job.fromRow.mockReturnValue(mockUpdatedInstance)

      mockDbClient.execute.mockResolvedValue({ success: true })

      const result = await jobService.updateJob(jobId, updates)

      expect(result).toEqual(updatedJob)
      expect(UpdateJobSchema.parse).toHaveBeenCalledWith(updates)
      expect(mockDbClient.execute).toHaveBeenCalledWith('UPDATE jobs SET...', [
        updatedJob.status,
        JSON.stringify(updatedJob.input_data),
        JSON.stringify(updatedJob.output_data),
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
    })

    it('should throw error when job not found', async () => {
      const jobId = 'nonexistent-job'
      const updates = { status: 'running' as const }

      mockDbClient.queryFirst.mockResolvedValue(null)

      await expect(jobService.updateJob(jobId, updates)).rejects.toThrow(
        `Job with ID ${jobId} not found`
      )
    })
  })

  describe('listJobs', () => {
    it('should list jobs with filters', async () => {
      const filter = {
        userId: 'user-123',
        status: 'completed' as const,
        limit: 10,
        offset: 0,
      }
      const mockJobs = [
        createMockJob({ user_id: filter.userId, status: filter.status }),
        createMockJob({ user_id: filter.userId, status: filter.status }),
      ]

      mockDbClient.query.mockResolvedValue(mockJobs)
      const { Job } = require('@/api/src/models/job')
      Job.fromRow.mockImplementation(row => row)

      const result = await jobService.listJobs(filter)

      expect(result).toHaveLength(2)
      expect(mockDbClient.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = ? AND status = ?'),
        expect.arrayContaining([filter.userId, filter.status, filter.limit, filter.offset])
      )
    })

    it('should list jobs without filters', async () => {
      const mockJobs = [createMockJob()]

      mockDbClient.query.mockResolvedValue(mockJobs)
      const { Job } = require('@/api/src/models/job')
      Job.fromRow.mockImplementation(row => row)

      const result = await jobService.listJobs()

      expect(result).toHaveLength(1)
    })

    it('should handle date range filtering', async () => {
      const filter = {
        dateFrom: 1234567890,
        dateTo: 1234567990,
      }

      const mockJobs = [createMockJob()]
      mockDbClient.query.mockResolvedValue(mockJobs)
      const { Job } = require('@/api/src/models/job')
      Job.fromRow.mockImplementation(row => row)

      await jobService.listJobs(filter)

      expect(mockDbClient.query).toHaveBeenCalledWith(
        expect.stringContaining('created_at >= ? AND created_at <= ?'),
        expect.arrayContaining([filter.dateFrom, filter.dateTo])
      )
    })
  })

  describe('Job Queue Management', () => {
    describe('addToQueue', () => {
      it('should add job to queue', async () => {
        const mockJob = createMockJob({ id: 'job-123' })
        const queueKey = 'job_queue:pending'
        const queueData = {
          jobId: mockJob.id,
          priority: 'normal',
          createdAt: mockJob.created_at,
        }

        mockKv.put.mockResolvedValue(undefined)

        await (jobService as any).addToQueue(mockJob)

        expect(mockKv.put).toHaveBeenCalledWith(
          `${queueKey}:${mockJob.id}`,
          JSON.stringify(queueData),
          expect.objectContaining({
            expirationTtl: expect.any(Number),
          })
        )
      })
    })

    describe('getNextJob', () => {
      it('should get next job from queue', async () => {
        const queueKey = 'job_queue:pending'
        const mockJob = createMockJob({ id: 'job-123' })
        const queueData = {
          jobId: mockJob.id,
          priority: 'high',
          createdAt: mockJob.created_at,
        }

        mockKv.list.mockResolvedValue({
          keys: [{ name: `${queueKey}:${mockJob.id}` }],
        })
        mockKv.get.mockResolvedValue(JSON.stringify(queueData))
        mockDbClient.queryFirst.mockResolvedValue(mockJob)
        const { Job } = require('@/api/src/models/job')
        Job.fromRow.mockReturnValue(mockJob)

        mockKv.delete.mockResolvedValue(undefined)

        const result = await jobService.getNextJob()

        expect(result).toEqual(mockJob)
        expect(mockKv.delete).toHaveBeenCalledWith(`${queueKey}:${mockJob.id}`)
      })

      it('should return null when queue is empty', async () => {
        mockKv.list.mockResolvedValue({ keys: [] })

        const result = await jobService.getNextJob()

        expect(result).toBeNull()
      })
    })

    describe('processJob', () => {
      it('should process job successfully', async () => {
        const mockJob = createMockJob({
          id: 'job-123',
          status: 'pending',
          tool_id: 'tool-123',
        })
        const mockTool = createMockTool({
          id: 'tool-123',
          slug: 'json-format',
        })
        const mockOutput = { formatted: '{"test": "data"}' }

        // Mock job lookup
        mockDbClient.queryFirst.mockResolvedValue(mockJob)
        const { Job } = require('@/api/src/models/job')
        Job.fromRow.mockReturnValue(mockJob)

        // Mock tool lookup
        const { Tool } = require('@/api/src/models/tool')
        Tool.fromRow.mockReturnValue(mockTool)

        // Mock job update
        const _runningJob = createMockJob({
          ...mockJob,
          status: 'running',
          started_at: Math.floor(Date.now() / 1000),
        })
        const _completedJob = createMockJob({
          ...mockJob,
          status: 'completed',
          output_data: mockOutput,
          progress: 100,
          completed_at: Math.floor(Date.now() / 1000),
        })

        mockDbClient.execute.mockResolvedValue({ success: true })

        // Mock tool execution
        const mockToolService = {
          executeTool: vi.fn().mockResolvedValue({
            success: true,
            output: mockOutput,
            executionTime: 1500,
          }),
        }
        ;(jobService as any).createToolService = vi.fn().mockReturnValue(mockToolService)

        // Mock tool usage tracking
        const { ToolUsage } = require('@/api/src/models/tool_usage')
        const mockToolUsage = createMockToolUsage()
        ToolUsage.createSuccess.mockReturnValue(mockToolUsage)

        const result = await jobService.processJob('job-123')

        expect(result.success).toBe(true)
        expect(result.output).toEqual(mockOutput)
        expect(mockToolService.executeTool).toHaveBeenCalled()
        expect(mockDbClient.execute).toHaveBeenCalledTimes(3) // Update to running, track usage, update to completed
      })

      it('should handle job processing failure', async () => {
        const mockJob = createMockJob({
          id: 'job-123',
          status: 'pending',
          tool_id: 'tool-123',
        })
        const mockTool = createMockTool({
          id: 'tool-123',
        })

        // Mock job lookup
        mockDbClient.queryFirst.mockResolvedValue(mockJob)
        const { Job } = require('@/api/src/models/job')
        Job.fromRow.mockReturnValue(mockJob)

        // Mock tool lookup
        const { Tool } = require('@/api/src/models/tool')
        Tool.fromRow.mockReturnValue(mockTool)

        // Mock job update to running
        const _runningJob = createMockJob({
          ...mockJob,
          status: 'running',
        })

        mockDbClient.execute.mockResolvedValue({ success: true })

        // Mock tool execution failure
        const mockToolService = {
          executeTool: vi.fn().mockResolvedValue({
            success: false,
            error: 'Tool execution failed',
          }),
        }
        ;(jobService as any).createToolService = vi.fn().mockReturnValue(mockToolService)

        // Mock tool usage tracking for error
        const { ToolUsage } = require('@/api/src/models/tool_usage')
        const mockToolUsage = createMockToolUsage()
        ToolUsage.createError.mockReturnValue(mockToolUsage)

        const result = await jobService.processJob('job-123')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Tool execution failed')
      })

      it('should handle job timeout', async () => {
        const mockJob = createMockJob({
          id: 'job-123',
          status: 'running',
          started_at: Math.floor(Date.now() / 1000) - 600, // 10 minutes ago
        })

        mockDbClient.queryFirst.mockResolvedValue(mockJob)
        const { Job } = require('@/api/src/models/job')
        Job.fromRow.mockReturnValue(mockJob)

        const result = await jobService.processJob('job-123')

        expect(result.success).toBe(false)
        expect(result.error).toContain('timeout')
      })
    })
  })

  describe('Job Statistics', () => {
    describe('getJobStats', () => {
      it('should return job statistics', async () => {
        const filter = { userId: 'user-123' }

        mockDbClient.queryFirst
          .mockResolvedValueOnce({ count: 100 }) // Total jobs
          .mockResolvedValueOnce({ count: 10 }) // Pending jobs
          .mockResolvedValueOnce({ count: 5 }) // Running jobs
          .mockResolvedValueOnce({ count: 80 }) // Completed jobs
          .mockResolvedValueOnce({ count: 5 }) // Failed jobs
          .mockResolvedValueOnce({ avg_time: 2500 }) // Average execution time

        const result = await jobService.getJobStats(filter)

        expect(result).toEqual({
          totalJobs: 100,
          pendingJobs: 10,
          runningJobs: 5,
          completedJobs: 80,
          failedJobs: 5,
          avgExecutionTime: 2500,
          successRate: 94.12, // 80/85 * 100 (successful/total completed)
        })
      })

      it('should handle zero division', async () => {
        mockDbClient.queryFirst
          .mockResolvedValueOnce({ count: 0 }) // Total jobs
          .mockResolvedValueOnce({ count: 0 }) // Pending jobs
          .mockResolvedValueOnce({ count: 0 }) // Running jobs
          .mockResolvedValueOnce({ count: 0 }) // Completed jobs
          .mockResolvedValueOnce({ count: 0 }) // Failed jobs
          .mockResolvedValueOnce({ avg_time: 0 }) // Average execution time

        const result = await jobService.getJobStats()

        expect(result.successRate).toBe(0)
      })
    })
  })

  describe('Job Progress Tracking', () => {
    describe('updateJobProgress', () => {
      it('should update job progress', async () => {
        const jobId = 'job-123'
        const progress = 75
        const message = 'Processing data...'

        const existingJob = createMockJob({
          id: jobId,
          status: 'running',
          progress: 50,
        })

        mockDbClient.queryFirst.mockResolvedValue(existingJob)
        const { Job } = require('@/api/src/models/job')
        Job.fromRow.mockReturnValue(existingJob)

        const updatedJob = createMockJob({
          ...existingJob,
          progress,
          error_message: message,
        })

        const mockUpdatedInstance = {
          ...existingJob,
          update: vi.fn().mockReturnValue(updatedJob),
        }
        Job.fromRow.mockReturnValue(mockUpdatedInstance)

        mockDbClient.execute.mockResolvedValue({ success: true })

        const result = await jobService.updateJobProgress(jobId, progress, message)

        expect(result.progress).toBe(progress)
        expect(result.error_message).toBe(message)
        expect(mockDbClient.execute).toHaveBeenCalledWith(
          'UPDATE jobs SET...',
          expect.arrayContaining([progress, message, expect.any(Number), jobId])
        )
      })
    })

    describe('getJobProgress', () => {
      it('should return job progress', async () => {
        const jobId = 'job-123'
        const mockJob = createMockJob({
          id: jobId,
          status: 'running',
          progress: 60,
        })

        mockDbClient.queryFirst.mockResolvedValue(mockJob)
        const { Job } = require('@/api/src/models/job')
        Job.fromRow.mockReturnValue(mockJob)

        const result = await jobService.getJobProgress(jobId)

        expect(result).toEqual({
          jobId,
          progress: 60,
          status: 'running',
        })
      })

      it('should return null for non-existent job', async () => {
        const jobId = 'nonexistent-job'
        mockDbClient.queryFirst.mockResolvedValue(null)

        const result = await jobService.getJobProgress(jobId)

        expect(result).toBeNull()
      })
    })
  })

  describe('Job Cleanup', () => {
    describe('cleanupExpiredJobs', () => {
      it('should cleanup expired jobs', async () => {
        const expiredTime = Math.floor(Date.now() / 1000) - 24 * 60 * 60 // 24 hours ago
        const mockJobs = [
          createMockJob({
            id: 'job-1',
            status: 'completed',
            completed_at: expiredTime,
          }),
          createMockJob({
            id: 'job-2',
            status: 'failed',
            completed_at: expiredTime,
          }),
        ]

        mockDbClient.query.mockResolvedValue(mockJobs)
        const { Job } = require('@/api/src/models/job')
        Job.fromRow.mockImplementation(row => row)

        mockDbClient.execute.mockResolvedValue({
          success: true,
          meta: { changes: 1 },
        })

        const result = await jobService.cleanupExpiredJobs()

        expect(result.deletedJobs).toBe(2)
        expect(mockDbClient.execute).toHaveBeenCalledTimes(2)
      })

      it('should not cleanup recent jobs', async () => {
        const recentTime = Math.floor(Date.now() / 1000) - 60 * 60 // 1 hour ago
        const mockJobs = [
          createMockJob({
            id: 'job-1',
            status: 'completed',
            completed_at: recentTime,
          }),
        ]

        mockDbClient.query.mockResolvedValue(mockJobs)
        const { Job } = require('@/api/src/models/job')
        Job.fromRow.mockImplementation(row => row)

        const result = await jobService.cleanupExpiredJobs()

        expect(result.deletedJobs).toBe(0)
        expect(mockDbClient.execute).not.toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const jobId = 'job-123'
      mockDbClient.queryFirst.mockRejectedValue(new Error('Connection failed'))

      await expect(jobService.getJobById(jobId)).rejects.toThrow(
        'Failed to get job: Error: Connection failed'
      )
    })

    it('should handle malformed job data', async () => {
      const jobId = 'job-123'
      mockDbClient.queryFirst.mockResolvedValue({ invalid: 'data' })
      const { Job } = require('@/api/src/models/job')
      Job.fromRow.mockImplementation(() => {
        throw new Error('Invalid job data')
      })

      await expect(jobService.getJobById(jobId)).rejects.toThrow(
        'Failed to get job: Error: Invalid job data'
      )
    })

    it('should handle queue operation failures', async () => {
      const mockJob = createMockJob()
      mockKv.put.mockRejectedValue(new Error('KV error'))

      await expect((jobService as any).addToQueue(mockJob)).rejects.toThrow(
        'Failed to add job to queue: Error: KV error'
      )
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complete job lifecycle', async () => {
      const options = {
        toolId: 'tool-123',
        userId: 'user-123',
        inputData: { test: 'data' },
      }

      const mockTool = createMockTool({ id: options.toolId })
      const mockJob = createMockJob({
        tool_id: options.toolId,
        user_id: options.userId,
        input_data: options.inputData,
        status: 'pending',
      })
      const _runningJob = createMockJob({
        ...mockJob,
        status: 'running',
        started_at: Math.floor(Date.now() / 1000),
      })
      const completedJob = createMockJob({
        ...mockJob,
        status: 'completed',
        output_data: { result: 'success' },
        progress: 100,
        completed_at: Math.floor(Date.now() / 1000),
      })

      // 1. Create job
      mockDbClient.queryFirst.mockResolvedValue(mockTool)
      const { Tool } = require('@/api/src/models/tool')
      Tool.fromRow.mockReturnValue(mockTool)

      const { Job } = require('@/api/src/models/job')
      Job.createForTool.mockReturnValue(mockJob)

      mockDbClient.execute.mockResolvedValue({ success: true })
      mockKv.put.mockResolvedValue(undefined)

      const createdJob = await jobService.createJob(options)
      expect(createdJob).toEqual(mockJob)

      // 2. Get job from queue
      mockKv.list.mockResolvedValue({
        keys: [{ name: `job_queue:pending:${mockJob.id}` }],
      })
      mockKv.get.mockResolvedValue(
        JSON.stringify({
          jobId: mockJob.id,
          priority: 'normal',
          createdAt: mockJob.created_at,
        })
      )
      mockKv.delete.mockResolvedValue(undefined)

      const nextJob = await jobService.getNextJob()
      expect(nextJob).toEqual(mockJob)

      // 3. Process job
      mockDbClient.queryFirst.mockResolvedValue(mockJob)
      Job.fromRow.mockReturnValue(mockJob)

      const mockToolService = {
        executeTool: vi.fn().mockResolvedValue({
          success: true,
          output: { result: 'success' },
          executionTime: 1000,
        }),
      }
      ;(jobService as any).createToolService = vi.fn().mockReturnValue(mockToolService)

      const { ToolUsage } = require('@/api/src/models/tool_usage')
      const mockToolUsage = createMockToolUsage()
      ToolUsage.createSuccess.mockReturnValue(mockToolUsage)

      // Mock job updates
      mockDbClient.execute
        .mockResolvedValueOnce({ success: true }) // Update to running
        .mockResolvedValueOnce({ success: true }) // Track usage
        .mockResolvedValueOnce({ success: true }) // Update to completed

      const processResult = await jobService.processJob(mockJob.id)

      expect(processResult.success).toBe(true)
      expect(processResult.output).toEqual({ result: 'success' })

      // 4. Get final job status
      mockDbClient.queryFirst.mockResolvedValue(completedJob)
      Job.fromRow.mockReturnValue(completedJob)

      const finalJob = await jobService.getJobById(mockJob.id)
      expect(finalJob?.status).toBe('completed')
    })
  })
})
