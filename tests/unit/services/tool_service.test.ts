import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ToolService } from '@/api/src/services/tool_service'
import {
  createTestDatabase,
  createMockTool,
  createMockToolUsage,
  createMockJob,
  createMockUser,
  createMockAuditLog,
  setupTestEnvironment,
  cleanupTestEnvironment,
  type MockD1Database,
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

// Mock Cloudflare services
vi.mock('@/api/src/services/cloudflare/cloudflare-service', () => ({
  CloudflareService: vi.fn().mockImplementation(() => ({
    getKVCacheService: vi.fn().mockReturnValue({
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      getOrSet: vi.fn(),
      invalidate: vi.fn(),
      warmup: vi.fn(),
      getAnalytics: vi.fn(),
      getMetrics: vi.fn(),
    }),
  })),
}))

vi.mock('@/api/src/services/cloudflare/kv-cache', () => ({
  KVCacheService: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    getOrSet: vi.fn(),
    invalidate: vi.fn(),
    warmup: vi.fn(),
    getAnalytics: vi.fn(),
    getMetrics: vi.fn(),
  })),
}))

// Mock the models
vi.mock('@/api/src/models/tool', () => ({
  Tool: {
    create: vi.fn(),
    fromRow: vi.fn(),
  },
  ToolSchema: {
    parse: vi.fn(),
    safeParse: vi.fn(),
  },
  CreateToolSchema: {
    parse: vi.fn(),
  },
  UpdateToolSchema: {
    parse: vi.fn(),
  },
  TOOL_QUERIES: {
    INSERT: 'INSERT INTO tools...',
    SELECT_BY_ID: 'SELECT * FROM tools WHERE id = ?',
    SELECT_BY_SLUG: 'SELECT * FROM tools WHERE slug = ?',
    SELECT_BY_CATEGORY: 'SELECT * FROM tools WHERE category = ?',
    SELECT_ENABLED: 'SELECT * FROM tools WHERE enabled = true',
    SELECT_BETA: 'SELECT * FROM tools WHERE beta = true',
    UPDATE: 'UPDATE tools SET...',
    DELETE: 'DELETE FROM tools WHERE id = ?',
  },
}))

vi.mock('@/api/src/models/tool_usage', () => ({
  ToolUsage: {
    createSuccess: vi.fn(),
    createError: vi.fn(),
    fromRow: vi.fn(),
  },
  TOOL_USAGE_QUERIES: {
    INSERT: 'INSERT INTO tool_usage...',
    COUNT_BY_TOOL: 'SELECT COUNT(*) as count FROM tool_usage WHERE tool_id = ?',
    COUNT_BY_USER: 'SELECT COUNT(*) as count FROM tool_usage WHERE user_id = ?',
  },
}))

vi.mock('@/api/src/models/job', () => ({
  Job: {
    create: vi.fn(),
    createForTool: vi.fn(),
    fromRow: vi.fn(),
  },
  JobSchema: {
    parse: vi.fn(),
  },
  JOB_QUERIES: {
    INSERT: 'INSERT INTO jobs...',
    SELECT_BY_ID: 'SELECT * FROM jobs WHERE id = ?',
    UPDATE: 'UPDATE jobs SET...',
  },
}))

vi.mock('@/api/src/models/quota_counter', () => ({
  QuotaCounter: {
    create: vi.fn(),
    createForAnonymous: vi.fn(),
    createPeriod: vi.fn(),
    fromRow: vi.fn(),
  },
  QUOTA_COUNTER_QUERIES: {
    INSERT: 'INSERT INTO quota_counters...',
    SELECT_BY_USER_AND_TYPE: 'SELECT * FROM quota_counters WHERE quota_type = ?',
    UPDATE_USAGE: 'UPDATE quota_counters SET...',
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

describe('ToolService', () => {
  let toolService: ToolService
  let mockDb: MockD1Database
  let mockKv: any
  let mockDbClient: any
  let mockCacheService: any

  beforeEach(() => {
    setupTestEnvironment()

    mockDb = createTestDatabase({
      tools: [createMockTool()],
      tool_usage: [createMockToolUsage()],
      jobs: [createMockJob()],
      users: [createMockUser()],
      audit_logs: [createMockAuditLog()],
    })

    mockKv = {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
    }

    mockCacheService = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      getOrSet: vi.fn(),
      invalidate: vi.fn(),
      warmup: vi.fn(),
      getAnalytics: vi.fn(),
      getMetrics: vi.fn(),
    }

    const mockCloudflareService = {
      getKVCacheService: vi.fn().mockReturnValue(mockCacheService),
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

    toolService = new ToolService({
      db: mockDb as any,
      kv: mockKv,
      auditEnabled: true,
      enableBetaFeatures: false,
      cloudflareService: mockCloudflareService,
      enableAdvancedCaching: true,
    })
  })

  afterEach(() => {
    cleanupTestEnvironment()
    vi.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      const service = new ToolService({
        db: mockDb as any,
        kv: mockKv,
      })
      expect(service).toBeDefined()
    })

    it('should initialize with custom options', () => {
      const service = new ToolService({
        db: mockDb as any,
        kv: mockKv,
        auditEnabled: false,
        enableBetaFeatures: true,
        enableAdvancedCaching: false,
      })
      expect(service).toBeDefined()
    })
  })

  describe('Tool CRUD Operations', () => {
    describe('createTool', () => {
      it('should create a tool successfully', async () => {
        const toolData = {
          slug: 'test-tool',
          name: 'Test Tool',
          category: 'test',
          description: 'A test tool',
          config: {
            inputSchema: { type: 'string' },
            outputSchema: { type: 'string' },
            executionMode: 'sync',
            quotas: {
              maxInputSize: 1024,
              maxExecutionTime: 5000,
              requiresAuth: false,
            },
            parameters: [],
          },
        }

        const mockTool = createMockTool(toolData)
        const { Tool, CreateToolSchema } = require('@/api/src/models/tool')

        CreateToolSchema.parse.mockReturnValue(toolData)
        Tool.create.mockReturnValue(mockTool)

        mockDbClient.execute.mockResolvedValue({ success: true })

        const result = await toolService.createTool(toolData)

        expect(result).toEqual(mockTool)
        expect(CreateToolSchema.parse).toHaveBeenCalledWith(toolData)
        expect(Tool.create).toHaveBeenCalledWith(toolData)
        expect(mockDbClient.execute).toHaveBeenCalledWith(
          'INSERT INTO tools...',
          [
            mockTool.id,
            mockTool.slug,
            mockTool.name,
            mockTool.category,
            mockTool.description,
            JSON.stringify(mockTool.config),
            mockTool.enabled,
            mockTool.beta,
            mockTool.sort_order,
            mockTool.created_at,
            mockTool.updated_at,
          ]
        )
      })

      it('should handle database errors', async () => {
        const toolData = {
          slug: 'test-tool',
          name: 'Test Tool',
          category: 'test',
        }

        const { Tool, CreateToolSchema } = require('@/api/src/models/tool')
        CreateToolSchema.parse.mockReturnValue(toolData)
        Tool.create.mockReturnValue(createMockTool(toolData))

        mockDbClient.execute.mockRejectedValue(new Error('Database error'))

        await expect(toolService.createTool(toolData))
          .rejects.toThrow('Failed to create tool: Error: Database error')
      })
    })

    describe('getToolById', () => {
      it('should return tool from cache', async () => {
        const toolId = 'tool-123'
        const mockTool = createMockTool({ id: toolId })

        mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
          return await fetchFn()
        })

        mockDbClient.queryFirst.mockResolvedValue(mockTool)
        const { Tool } = require('@/api/src/models/tool')
        Tool.fromRow.mockReturnValue(mockTool)

        const result = await toolService.getToolById(toolId)

        expect(result).toEqual(mockTool)
        expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
          `tool:${toolId}`,
          expect.any(Function),
          expect.objectContaining({
            namespace: 'cache',
            ttl: 1800,
            tags: ['tool', `tool_id:${toolId}`],
          })
        )
      })

      it('should return tool from local cache', async () => {
        const toolId = 'tool-123'
        const mockTool = createMockTool({ id: toolId })

        // Create service without advanced caching
        const serviceWithoutAdvancedCache = new ToolService({
          db: mockDb as any,
          kv: mockKv,
          enableAdvancedCaching: false,
        })

        // Manually add tool to local cache
        ;(serviceWithoutAdvancedCache as any).toolCache.set(toolId, mockTool)
        ;(serviceWithoutAdvancedCache as any).cacheExpiry.set(
          toolId,
          Date.now() + 5 * 60 * 1000
        )

        const result = await serviceWithoutAdvancedCache.getToolById(toolId)

        expect(result).toEqual(mockTool)
      })

      it('should return null when tool not found', async () => {
        const toolId = 'nonexistent-tool'

        mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
          return await fetchFn()
        })

        mockDbClient.queryFirst.mockResolvedValue(null)

        const result = await toolService.getToolById(toolId)

        expect(result).toBeNull()
      })

      it('should handle database errors', async () => {
        const toolId = 'tool-123'

        mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
          return await fetchFn()
        })

        mockDbClient.queryFirst.mockRejectedValue(new Error('Database error'))

        await expect(toolService.getToolById(toolId))
          .rejects.toThrow('Failed to get tool: Error: Database error')
      })
    })

    describe('getToolBySlug', () => {
      it('should return tool by slug', async () => {
        const slug = 'json-format'
        const mockTool = createMockTool({ slug })

        mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
          return await fetchFn()
        })

        mockDbClient.queryFirst.mockResolvedValue(mockTool)
        const { Tool } = require('@/api/src/models/tool')
        Tool.fromRow.mockReturnValue(mockTool)

        const result = await toolService.getToolBySlug(slug)

        expect(result).toEqual(mockTool)
        expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
          `tool_by_slug:${slug}`,
          expect.any(Function),
          expect.objectContaining({
            namespace: 'cache',
            tags: ['tool', 'slug_lookup'],
          })
        )
      })

      it('should return null when tool not found by slug', async () => {
        const slug = 'nonexistent-tool'

        mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
          return await fetchFn()
        })

        mockDbClient.queryFirst.mockResolvedValue(null)

        const result = await toolService.getToolBySlug(slug)

        expect(result).toBeNull()
      })
    })

    describe('updateTool', () => {
      it('should update tool successfully', async () => {
        const toolId = 'tool-123'
        const existingTool = createMockTool({ id: toolId, name: 'Old Name' })
        const updateData = { name: 'New Name' }
        const updatedTool = createMockTool({ id: toolId, name: 'New Name' })

        mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
          return await fetchFn()
        })

        mockDbClient.queryFirst.mockResolvedValue(existingTool)
        const { Tool, UpdateToolSchema } = require('@/api/src/models/tool')
        Tool.fromRow.mockReturnValue(existingTool)
        UpdateToolSchema.parse.mockReturnValue(updateData)

        const mockUpdatedInstance = {
          ...existingTool,
          update: vi.fn().mockReturnValue(updatedTool),
        }
        Tool.fromRow.mockReturnValue(mockUpdatedInstance)

        mockDbClient.execute.mockResolvedValue({ success: true })

        const result = await toolService.updateTool(toolId, updateData)

        expect(result).toEqual(updatedTool)
        expect(UpdateToolSchema.parse).toHaveBeenCalledWith(updateData)
        expect(mockDbClient.execute).toHaveBeenCalledWith(
          'UPDATE tools SET...',
          [
            updatedTool.name,
            updatedTool.category,
            updatedTool.description,
            JSON.stringify(updatedTool.config),
            updatedTool.enabled,
            updatedTool.beta,
            updatedTool.sort_order,
            updatedTool.updated_at,
            updatedTool.id,
          ]
        )
      })

      it('should throw error when tool not found', async () => {
        const toolId = 'nonexistent-tool'
        const updateData = { name: 'New Name' }

        mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
          return await fetchFn()
        })

        mockDbClient.queryFirst.mockResolvedValue(null)

        await expect(toolService.updateTool(toolId, updateData))
          .rejects.toThrow(`Tool with ID ${toolId} not found`)
      })
    })

    describe('deleteTool', () => {
      it('should delete tool successfully', async () => {
        const toolId = 'tool-123'
        const existingTool = createMockTool({ id: toolId })

        mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
          return await fetchFn()
        })

        mockDbClient.queryFirst.mockResolvedValue(existingTool)
        const { Tool } = require('@/api/src/models/tool')
        Tool.fromRow.mockReturnValue(existingTool)

        mockDbClient.execute.mockResolvedValue({ success: true })

        await toolService.deleteTool(toolId)

        expect(mockDbClient.execute).toHaveBeenCalledWith(
          'DELETE FROM tools WHERE id = ?',
          [toolId]
        )
      })

      it('should throw error when tool not found', async () => {
        const toolId = 'nonexistent-tool'

        mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
          return await fetchFn()
        })

        mockDbClient.queryFirst.mockResolvedValue(null)

        await expect(toolService.deleteTool(toolId))
          .rejects.toThrow(`Tool with ID ${toolId} not found`)
      })
    })
  })

  describe('Tool Listing and Filtering', () => {
    describe('getTools', () => {
      it('should get enabled tools by category', async () => {
        const category = 'json'
        const mockTools = [
          createMockTool({ category, slug: 'json-format' }),
          createMockTool({ category, slug: 'json-validate' }),
        ]

        mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
          return await fetchFn()
        })

        mockDbClient.query.mockResolvedValue(mockTools)
        const { Tool } = require('@/api/src/models/tool')
        Tool.fromRow.mockImplementation((row) => row)

        const result = await toolService.getTools(category, true)

        expect(result).toHaveLength(2)
        expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
          `tools:${category}:true`,
          expect.any(Function),
          expect.objectContaining({
            namespace: 'cache',
            ttl: 900,
            tags: ['tools_list', `category:${category}`],
          })
        )
      })

      it('should get all tools when no category specified', async () => {
        const mockTools = [
          createMockTool({ category: 'json' }),
          createMockTool({ category: 'code' }),
        ]

        mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
          return await fetchFn()
        })

        mockDbClient.query.mockResolvedValue(mockTools)
        const { Tool } = require('@/api/src/models/tool')
        Tool.fromRow.mockImplementation((row) => row)

        const result = await toolService.getTools()

        expect(result).toHaveLength(2)
        expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
          'tools:all:true',
          expect.any(Function),
          expect.objectContaining({
            tags: ['tools_list', 'category:all'],
          })
        )
      })

      it('should filter out beta tools when disabled', async () => {
        const mockTools = [
          createMockTool({ beta: false }),
          createMockTool({ beta: true }),
        ]

        mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
          return await fetchFn()
        })

        mockDbClient.query.mockResolvedValue(mockTools)
        const { Tool } = require('@/api/src/models/tool')
        Tool.fromRow.mockImplementation((row) => row)

        const result = await toolService.getTools(undefined, true)

        expect(result).toHaveLength(1) // Only non-beta tool
      })

      it('should include beta tools when enabled', async () => {
        const serviceWithBeta = new ToolService({
          db: mockDb as any,
          kv: mockKv,
          enableBetaFeatures: true,
        })

        const mockTools = [
          createMockTool({ beta: false }),
          createMockTool({ beta: true }),
        ]

        mockDbClient.query.mockResolvedValue(mockTools)
        const { Tool } = require('@/api/src/models/tool')
        Tool.fromRow.mockImplementation((row) => row)

        const result = await serviceWithBeta.getTools(undefined, true)

        expect(result).toHaveLength(2) // Both tools
      })
    })

    describe('searchTools', () => {
      it('should search tools by query', async () => {
        const query = 'json'
        const mockTools = [
          createMockTool({ name: 'JSON Formatter', slug: 'json-format' }),
          createMockTool({ name: 'JSON Validator', slug: 'json-validate' }),
        ]

        mockDbClient.query.mockResolvedValue(mockTools)
        const { Tool } = require('@/api/src/models/tool')
        Tool.fromRow.mockImplementation((row) => row)

        const result = await toolService.searchTools(query)

        expect(result).toHaveLength(2)
        expect(mockDbClient.query).toHaveBeenCalledWith(
          expect.stringContaining('WHERE (name LIKE ? OR description LIKE ? OR slug LIKE ?)'),
          ['%json%', '%json%', '%json%']
        )
      })
    })
  })

  describe('Tool Execution', () => {
    describe('executeTool', () => {
      it('should execute sync tool successfully', async () => {
        const toolId = 'tool-123'
        const mockTool = createMockTool({
          id: toolId,
          slug: 'json-format',
          enabled: true,
          beta: false,
        })

        const options = {
          input: { json: '{"test": "data"}' },
          userId: 'user-123',
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        }

        mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
          return await fetchFn()
        })

        mockDbClient.queryFirst.mockResolvedValue(mockTool)
        const { Tool } = require('@/api/src/models/tool')
        Tool.fromRow.mockReturnValue(mockTool)

        // Mock quota check
        mockDbClient.queryFirst.mockResolvedValue(null) // No quota limits

        // Mock tool usage tracking
        const { ToolUsage } = require('@/api/src/models/tool_usage')
        const mockToolUsage = createMockToolUsage()
        ToolUsage.createSuccess.mockReturnValue(mockToolUsage)
        mockDbClient.execute.mockResolvedValue({ success: true })

        const result = await toolService.executeTool(toolId, options)

        expect(result.success).toBe(true)
        expect(result.output).toBeDefined()
        expect(result.executionTime).toBeDefined()
        expect(result.quotaRemaining).toBeDefined()
        expect(result.quotaLimit).toBeDefined()
      })

      it('should return error when tool not found', async () => {
        const toolId = 'nonexistent-tool'
        const options = {
          input: { test: 'data' },
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        }

        mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
          return await fetchFn()
        })

        mockDbClient.queryFirst.mockResolvedValue(null)

        const result = await toolService.executeTool(toolId, options)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Tool not found')
      })

      it('should return error when tool not available', async () => {
        const toolId = 'tool-123'
        const mockTool = createMockTool({ id: toolId, enabled: false })

        const options = {
          input: { test: 'data' },
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        }

        mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
          return await fetchFn()
        })

        mockDbClient.queryFirst.mockResolvedValue(mockTool)
        const { Tool } = require('@/api/src/models/tool')
        Tool.fromRow.mockReturnValue(mockTool)

        const result = await toolService.executeTool(toolId, options)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Tool is not available')
      })

      it('should return error when quota exceeded', async () => {
        const toolId = 'tool-123'
        const mockTool = createMockTool({ id: toolId, enabled: true })

        const options = {
          input: { test: 'data' },
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        }

        mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
          return await fetchFn()
        })

        mockDbClient.queryFirst.mockResolvedValue(mockTool)
        const { Tool } = require('@/api/src/models/tool')
        Tool.fromRow.mockReturnValue(mockTool)

        // Mock quota exceeded
        const mockQuota = {
          used_count: 100,
          limit_count: 100,
        }
        const { QuotaCounter } = require('@/api/src/models/quota_counter')
        QuotaCounter.fromRow.mockReturnValue(mockQuota)
        mockDbClient.queryFirst.mockResolvedValue(mockQuota)

        const result = await toolService.executeTool(toolId, options)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Quota exceeded')
        expect(result.quotaRemaining).toBe(0)
        expect(result.quotaLimit).toBe(100)
      })

      it('should validate input when required', async () => {
        const toolId = 'tool-123'
        const mockTool = createMockTool({
          id: toolId,
          enabled: true,
        })

        const options = {
          input: { invalid: 'data' },
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          validateInput: true,
        }

        mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
          return await fetchFn()
        })

        mockDbClient.queryFirst.mockResolvedValue(mockTool)
        const { Tool } = require('@/api/src/models/tool')
        Tool.fromRow.mockReturnValue(mockTool)

        // Mock validation failure
        const mockValidation = {
          valid: false,
          errors: ['Invalid input format'],
        }
        ;(mockTool as any).validateInput = vi.fn().mockReturnValue(mockValidation)

        const result = await toolService.executeTool(toolId, options)

        expect(result.success).toBe(false)
        expect(result.error).toContain('Invalid input')
      })

      it('should handle async tool execution', async () => {
        const toolId = 'tool-123'
        const mockTool = createMockTool({
          id: toolId,
          enabled: true,
        })

        const options = {
          input: { test: 'data' },
          userId: 'user-123',
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        }

        mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
          return await fetchFn()
        })

        mockDbClient.queryFirst.mockResolvedValue(mockTool)
        const { Tool } = require('@/api/src/models/tool')
        Tool.fromRow.mockReturnValue(mockTool)

        // Mock async execution mode
        ;(mockTool as any).executionMode = 'async'

        // Mock job creation
        const { Job } = require('@/api/src/models/job')
        const mockJob = createMockJob()
        Job.create.mockReturnValue(mockJob)

        // Mock quota check
        mockDbClient.queryFirst.mockResolvedValue(null)

        const result = await toolService.executeTool(toolId, options)

        expect(result.success).toBe(true)
        expect(result.jobId).toBe(mockJob.id)
        expect(result.output).toBeUndefined()
      })

      it('should handle tool execution errors', async () => {
        const toolId = 'tool-123'
        const mockTool = createMockTool({
          id: toolId,
          enabled: true,
          slug: 'error-tool',
        })

        const options = {
          input: { test: 'data' },
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        }

        mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
          return await fetchFn()
        })

        mockDbClient.queryFirst.mockResolvedValue(mockTool)
        const { Tool } = require('@/api/src/models/tool')
        Tool.fromRow.mockReturnValue(mockTool)

        // Mock quota check
        mockDbClient.queryFirst.mockResolvedValue(null)

        // Mock tool usage tracking for error
        const { ToolUsage } = require('@/api/src/models/tool_usage')
        const mockToolUsage = createMockToolUsage()
        ToolUsage.createError.mockReturnValue(mockToolUsage)
        mockDbClient.execute.mockResolvedValue({ success: true })

        const result = await toolService.executeTool(toolId, options)

        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.executionTime).toBeDefined()
      })
    })
  })

  describe('Tool Statistics', () => {
    describe('getToolStats', () => {
      it('should return tool statistics', async () => {
        const toolId = 'tool-123'
        const mockTool = createMockTool({ id: toolId })

        mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
          return await fetchFn()
        })

        mockDbClient.queryFirst
          .mockResolvedValueOnce(mockTool) // Tool lookup
          .mockResolvedValueOnce({ count: 50 }) // Total usage
          .mockResolvedValueOnce({ count: 45 }) // Success count
          .mockResolvedValueOnce({ avg_time: 1500 }) // Average execution time
          .mockResolvedValueOnce({ last_used: 1234567890 }) // Last used

        const { Tool } = require('@/api/src/models/tool')
        Tool.fromRow.mockReturnValue(mockTool)

        const result = await toolService.getToolStats(toolId)

        expect(result).toEqual({
          toolId,
          name: mockTool.name,
          category: mockTool.category,
          totalUsage: 50,
          successRate: 90, // 45/50 * 100
          avgExecutionTime: 1500,
          lastUsed: 1234567890,
        })
      })

      it('should throw error when tool not found', async () => {
        const toolId = 'nonexistent-tool'

        mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
          return await fetchFn()
        })

        mockDbClient.queryFirst.mockResolvedValue(null)

        await expect(toolService.getToolStats(toolId))
          .rejects.toThrow(`Tool with ID ${toolId} not found`)
      })
    })

    describe('getPopularTools', () => {
      it('should return popular tools', async () => {
        const limit = 5
        const mockUsageData = [
          { tool_id: 'tool-1', usage_count: 100 },
          { tool_id: 'tool-2', usage_count: 80 },
        ]

        const mockTools = [
          createMockTool({ id: 'tool-1', name: 'Tool 1' }),
          createMockTool({ id: 'tool-2', name: 'Tool 2' }),
        ]

        mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
          return await fetchFn()
        })

        mockDbClient.queryFirst.mockResolvedValue(mockUsageData[0])
        mockDbClient.queryFirst.mockResolvedValue(mockUsageData[1])
        const { Tool } = require('@/api/src/models/tool')
        Tool.fromRow.mockReturnValue(mockTools[0]).mockReturnValueOnce(mockTools[1])

        const result = await toolService.getPopularTools(limit)

        expect(result).toHaveLength(2)
        expect(result[0]).toEqual({
          tool: mockTools[0],
          usageCount: 100,
        })
        expect(result[1]).toEqual({
          tool: mockTools[1],
          usageCount: 80,
        })
      })
    })
  })

  describe('Mock Tool Implementations', () => {
    describe('formatJson', () => {
      it('should format JSON correctly', async () => {
        const input = {
          json: '{"name":"test","value":123}',
          indent: 2,
          sort_keys: true,
        }

        const result = await (toolService as any).formatJson(input)

        expect(result.valid).toBe(true)
        expect(result.formatted).toContain('"name": "test"')
        expect(result.formatted).toContain('"value": 123')
        expect(result.errors).toBeNull()
      })

      it('should handle invalid JSON', async () => {
        const input = {
          json: '{"invalid": json}',
        }

        const result = await (toolService as any).formatJson(input)

        expect(result.valid).toBe(false)
        expect(result.formatted).toBeNull()
        expect(result.errors).toBeDefined()
      })
    })

    describe('validateJson', () => {
      it('should validate correct JSON', async () => {
        const input = {
          json: '{"name":"test","value":123}',
        }

        const result = await (toolService as any).validateJson(input)

        expect(result.valid).toBe(true)
        expect(result.errors).toBeNull()
        expect(result.data).toEqual({ name: 'test', value: 123 })
      })

      it('should validate against schema', async () => {
        const input = {
          json: '{"name":"test","value":123}',
          schema: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' },
              value: { type: 'number' },
            },
          },
        }

        const result = await (toolService as any).validateJson(input)

        expect(result.valid).toBe(true)
        expect(result.errors).toBeNull()
      })

      it('should report schema validation errors', async () => {
        const input = {
          json: '{"name":123}', // name should be string
          schema: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' },
            },
          },
        }

        const result = await (toolService as any).validateJson(input)

        expect(result.valid).toBe(false)
        expect(result.errors).toBeDefined()
      })
    })
  })

  describe('Cache Management', () => {
    describe('clearCache', () => {
      it('should clear local cache', () => {
        const service = new ToolService({
          db: mockDb as any,
          kv: mockKv,
          enableAdvancedCaching: false,
        })

        // Add some data to local cache
        ;(service as any).toolCache.set('tool-1', createMockTool())
        ;(service as any).cacheExpiry.set('tool-1', Date.now() + 1000)

        service.clearCache()

        expect((service as any).toolCache.size).toBe(0)
        expect((service as any).cacheExpiry.size).toBe(0)
      })
    })

    describe('invalidateToolCache', () => {
      it('should invalidate specific tool cache', async () => {
        const toolId = 'tool-123'

        await toolService.invalidateToolCache(toolId)

        expect(mockCacheService.invalidate).toHaveBeenCalledWith({
          namespace: 'cache',
          tags: [`tool_id:${toolId}`, 'tool'],
        })
      })

      it('should invalidate all tool cache', async () => {
        await toolService.invalidateToolCache()

        expect(mockCacheService.invalidate).toHaveBeenCalledWith({
          namespace: 'cache',
          tags: ['tool', 'tools_list'],
        })
      })
    })

    describe('warmupAdvancedCache', () => {
      it('should warmup tool cache', async () => {
        const mockTools = [
          createMockTool({ id: 'tool-1', category: 'json' }),
          createMockTool({ id: 'tool-2', category: 'code' }),
        ]

        mockDbClient.query.mockResolvedValue(mockTools)
        const { Tool } = require('@/api/src/models/tool')
        Tool.fromRow.mockImplementation((row) => row)

        await toolService.warmupAdvancedCache()

        expect(mockCacheService.warmup).toHaveBeenCalledWith('cache', expect.any(Array))
      })
    })

    describe('getToolCacheAnalytics', () => {
      it('should return cache analytics', () => {
        const mockAnalytics = {
          totalKeys: 10,
          hitRate: 0.85,
          avgResponseTime: 15,
        }

        mockCacheService.getAnalytics.mockReturnValue(mockAnalytics)

        const result = toolService.getToolCacheAnalytics()

        expect(result).toEqual(mockAnalytics)
      })

      it('should return null when cache service not available', () => {
        const serviceWithoutCache = new ToolService({
          db: mockDb as any,
          kv: mockKv,
          enableAdvancedCaching: false,
        })

        const result = serviceWithoutCache.getToolCacheAnalytics()

        expect(result).toBeNull()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const toolId = 'tool-123'

      mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
        return await fetchFn()
      })

      mockDbClient.queryFirst.mockRejectedValue(new Error('Connection failed'))

      await expect(toolService.getToolById(toolId))
        .rejects.toThrow('Failed to get tool: Error: Connection failed')
    })

    it('should handle malformed tool data', async () => {
      const toolId = 'tool-123'

      mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
        return await fetchFn()
      })

      mockDbClient.queryFirst.mockResolvedValue({ invalid: 'data' })
      const { Tool } = require('@/api/src/models/tool')
      Tool.fromRow.mockImplementation(() => {
        throw new Error('Invalid tool data')
      })

      await expect(toolService.getToolById(toolId))
        .rejects.toThrow('Failed to get tool: Error: Invalid tool data')
    })

    it('should handle cache service errors gracefully', async () => {
      const toolId = 'tool-123'
      const mockTool = createMockTool({ id: toolId })

      mockCacheService.getOrSet.mockRejectedValue(new Error('Cache service error'))

      // Should fall back to database directly
      mockDbClient.queryFirst.mockResolvedValue(mockTool)
      const { Tool } = require('@/api/src/models/tool')
      Tool.fromRow.mockReturnValue(mockTool)

      const result = await toolService.getToolById(toolId)

      expect(result).toEqual(mockTool)
    })
  })
})
