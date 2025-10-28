import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  CreateToolUsageSchema,
  TOOL_USAGE_QUERIES,
  ToolUsage,
  ToolUsageAnalyticsSchema,
  ToolUsageSchema,
} from '../../../../apps/api/src/models/tool_usage'
import {
  cleanupTestEnvironment,
  createMockToolUsage,
  createTestDatabase,
  setupTestEnvironment,
} from './database.mock'

describe('ToolUsage Model', () => {
  let mockDb: any

  beforeEach(() => {
    setupTestEnvironment()
    mockDb = createTestDatabase()
  })

  afterEach(() => {
    cleanupTestEnvironment()
  })

  describe('Schema Validation', () => {
    it('should validate a complete tool usage object', () => {
      const usageData = createMockToolUsage()
      const result = ToolUsageSchema.safeParse(usageData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe(usageData.id)
        expect(result.data.user_id).toBe(usageData.user_id)
        expect(result.data.tool_id).toBe(usageData.tool_id)
        expect(result.data.status).toBe(usageData.status)
      }
    })

    it('should reject invalid status', () => {
      const invalidUsage = createMockToolUsage({ status: 'invalid' as any })
      const result = ToolUsageSchema.safeParse(invalidUsage)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('status')
      }
    })

    it('should accept valid statuses', () => {
      const validStatuses = ['success', 'error', 'timeout']

      validStatuses.forEach(status => {
        const usage = createMockToolUsage({ status: status as any })
        const result = ToolUsageSchema.safeParse(usage)
        expect(result.success).toBe(true)
      })
    })

    it('should validate tool usage creation schema', () => {
      const createData = {
        user_id: 'user-123',
        tool_id: 'tool-123',
        input_size: 1024,
        output_size: 2048,
        execution_time_ms: 1500,
        status: 'success' as const,
        ip_address: '127.0.0.1',
        user_agent: 'test-agent',
      }

      const result = CreateToolUsageSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })

    it('should validate analytics schema', () => {
      const analyticsData = {
        tool_id: 'tool-123',
        date: '2023-12-01',
        total_requests: 100,
        successful_requests: 95,
        failed_requests: 5,
        avg_execution_time_ms: 1200,
        total_input_size_bytes: 102400,
        total_output_size_bytes: 204800,
        unique_users: 50,
        anonymous_requests: 20,
      }

      const result = ToolUsageAnalyticsSchema.safeParse(analyticsData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid date format in analytics', () => {
      const invalidAnalytics = {
        tool_id: 'tool-123',
        date: '2023/12/01', // Wrong format
        total_requests: 100,
        successful_requests: 95,
        failed_requests: 5,
        avg_execution_time_ms: 1200,
        total_input_size_bytes: 102400,
        total_output_size_bytes: 204800,
        unique_users: 50,
        anonymous_requests: 20,
      }

      const result = ToolUsageAnalyticsSchema.safeParse(invalidAnalytics)
      expect(result.success).toBe(false)
    })
  })

  describe('Model Creation and Instantiation', () => {
    it('should create a tool usage instance with valid data', () => {
      const usageData = createMockToolUsage()
      const usage = new ToolUsage(usageData)

      expect(usage.id).toBe(usageData.id)
      expect(usage.user_id).toBe(usageData.user_id)
      expect(usage.tool_id).toBe(usageData.tool_id)
      expect(usage.status).toBe(usageData.status)
      expect(usage.input_size).toBe(usageData.input_size)
      expect(usage.output_size).toBe(usageData.output_size)
    })

    it('should create a tool usage with static create method', () => {
      const createData = {
        user_id: 'user-456',
        tool_id: 'tool-456',
        status: 'error' as const,
        error_message: 'Test error',
      }

      const usage = ToolUsage.create(createData)

      expect(usage.id).toBeDefined()
      expect(usage.user_id).toBe(createData.user_id)
      expect(usage.tool_id).toBe(createData.tool_id)
      expect(usage.status).toBe(createData.status)
      expect(usage.error_message).toBe(createData.error_message)
      expect(usage.created_at).toBeDefined()
      expect(usage.input_size).toBe(0)
      expect(usage.output_size).toBe(0)
    })

    it('should create tool usage from database row', () => {
      const rowData = createMockToolUsage()
      mockDb.setTableData('tool_usage', [rowData])

      const usage = ToolUsage.fromRow(rowData)

      expect(usage).toBeInstanceOf(ToolUsage)
      expect(usage.id).toBe(rowData.id)
      expect(usage.tool_id).toBe(rowData.tool_id)
    })
  })

  describe('Factory Methods', () => {
    it('should create successful tool usage', () => {
      const usage = ToolUsage.createSuccess(
        'tool-123',
        'user-123',
        1024,
        2048,
        1500,
        '127.0.0.1',
        'test-agent'
      )

      expect(usage.status).toBe('success')
      expect(usage.user_id).toBe('user-123')
      expect(usage.tool_id).toBe('tool-123')
      expect(usage.input_size).toBe(1024)
      expect(usage.output_size).toBe(2048)
      expect(usage.execution_time_ms).toBe(1500)
      expect(usage.ip_address).toBe('127.0.0.1')
      expect(usage.user_agent).toBe('test-agent')
      expect(usage.error_message).toBeNull()
    })

    it('should create error tool usage', () => {
      const usage = ToolUsage.createError(
        'tool-123',
        'user-123',
        'Test error message',
        512,
        1000,
        '127.0.0.1',
        'test-agent'
      )

      expect(usage.status).toBe('error')
      expect(usage.error_message).toBe('Test error message')
      expect(usage.input_size).toBe(512)
      expect(usage.execution_time_ms).toBe(1000)
      expect(usage.output_size).toBe(0)
    })

    it('should create timeout tool usage', () => {
      const usage = ToolUsage.createTimeout(
        'tool-123',
        'user-123',
        2048,
        5000,
        '127.0.0.1',
        'test-agent'
      )

      expect(usage.status).toBe('timeout')
      expect(usage.error_message).toBe('Execution timeout')
      expect(usage.input_size).toBe(2048)
      expect(usage.execution_time_ms).toBe(5000)
      expect(usage.output_size).toBe(0)
    })

    it('should create anonymous tool usage', () => {
      const usage = ToolUsage.createSuccess('tool-123', null, 1024, 2048, 1500)

      expect(usage.user_id).toBeNull()
      expect(usage.isAnonymous).toBe(true)
    })
  })

  describe('Database Operations', () => {
    it('should convert tool usage to database row format', () => {
      const usageData = createMockToolUsage()
      const usage = new ToolUsage(usageData)

      const row = usage.toRow()

      expect(row.id).toBe(usage.id)
      expect(row.user_id).toBe(usage.user_id)
      expect(row.tool_id).toBe(usage.tool_id)
      expect(row.status).toBe(usage.status)
      expect(row.input_size).toBe(usage.input_size)
      expect(row.output_size).toBe(usage.output_size)
    })
  })

  describe('Helper Methods and Business Logic', () => {
    it('should correctly identify successful usage', () => {
      const successUsage = new ToolUsage(createMockToolUsage({ status: 'success' }))
      const errorUsage = new ToolUsage(createMockToolUsage({ status: 'error' }))
      const timeoutUsage = new ToolUsage(createMockToolUsage({ status: 'timeout' }))

      expect(successUsage.isSuccessful).toBe(true)
      expect(errorUsage.isSuccessful).toBe(false)
      expect(timeoutUsage.isSuccessful).toBe(false)
    })

    it('should correctly identify failed usage', () => {
      const successUsage = new ToolUsage(createMockToolUsage({ status: 'success' }))
      const errorUsage = new ToolUsage(createMockToolUsage({ status: 'error' }))
      const timeoutUsage = new ToolUsage(createMockToolUsage({ status: 'timeout' }))

      expect(successUsage.isFailed).toBe(false)
      expect(errorUsage.isFailed).toBe(true)
      expect(timeoutUsage.isFailed).toBe(true)
    })

    it('should correctly identify anonymous usage', () => {
      const userUsage = new ToolUsage(createMockToolUsage({ user_id: 'user-123' }))
      const anonymousUsage = new ToolUsage(createMockToolUsage({ user_id: null }))

      expect(userUsage.isAnonymous).toBe(false)
      expect(anonymousUsage.isAnonymous).toBe(true)
    })

    it('should calculate data transfer ratio correctly', () => {
      const usage1 = new ToolUsage(createMockToolUsage({ input_size: 1000, output_size: 2000 }))
      const usage2 = new ToolUsage(createMockToolUsage({ input_size: 0, output_size: 1000 }))
      const usage3 = new ToolUsage(createMockToolUsage({ input_size: 1000, output_size: 0 }))

      expect(usage1.dataTransferRatio).toBe(2)
      expect(usage2.dataTransferRatio).toBe(0)
      expect(usage3.dataTransferRatio).toBe(0)
    })

    it('should format execution time correctly', () => {
      const usage1 = new ToolUsage(createMockToolUsage({ execution_time_ms: 500 }))
      const usage2 = new ToolUsage(createMockToolUsage({ execution_time_ms: 1500 }))
      const usage3 = new ToolUsage(createMockToolUsage({ execution_time_ms: null }))

      expect(usage1.executionTimeString).toBe('500ms')
      expect(usage2.executionTimeString).toBe('1.5s')
      expect(usage3.executionTimeString).toBe('N/A')
    })

    it('should format size string correctly', () => {
      const usage1 = new ToolUsage(createMockToolUsage({ input_size: 1024, output_size: 2048 }))
      const usage2 = new ToolUsage(createMockToolUsage({ input_size: 0, output_size: 0 }))

      expect(usage1.sizeString).toBe('1 KB → 2 KB')
      expect(usage2.sizeString).toBe('0 B → 0 B')
    })
  })

  describe('Analytics Methods', () => {
    it('should calculate analytics from usage data', () => {
      const usages = [
        new ToolUsage(
          createMockToolUsage({
            tool_id: 'tool-1',
            created_at: Math.floor(new Date('2023-12-01T10:00:00Z').getTime() / 1000),
            status: 'success',
            input_size: 1000,
            output_size: 2000,
            execution_time_ms: 1000,
            user_id: 'user-1',
          })
        ),
        new ToolUsage(
          createMockToolUsage({
            tool_id: 'tool-1',
            created_at: Math.floor(new Date('2023-12-01T11:00:00Z').getTime() / 1000),
            status: 'success',
            input_size: 1500,
            output_size: 2500,
            execution_time_ms: 1500,
            user_id: 'user-2',
          })
        ),
        new ToolUsage(
          createMockToolUsage({
            tool_id: 'tool-1',
            created_at: Math.floor(new Date('2023-12-01T12:00:00Z').getTime() / 1000),
            status: 'error',
            input_size: 500,
            output_size: 0,
            execution_time_ms: 500,
            user_id: null,
          })
        ),
        new ToolUsage(
          createMockToolUsage({
            tool_id: 'tool-2',
            created_at: Math.floor(new Date('2023-12-01T13:00:00Z').getTime() / 1000),
            status: 'success',
            input_size: 2000,
            output_size: 3000,
            execution_time_ms: 2000,
            user_id: 'user-1',
          })
        ),
      ]

      const analytics = ToolUsage.calculateAnalytics(usages)

      expect(analytics).toHaveLength(2) // 2 tools

      const tool1Analytics = analytics.find(a => a.tool_id === 'tool-1')
      expect(tool1Analytics).toBeDefined()
      expect(tool1Analytics?.total_requests).toBe(3)
      expect(tool1Analytics?.successful_requests).toBe(2)
      expect(tool1Analytics?.failed_requests).toBe(1)
      expect(tool1Analytics?.unique_users).toBe(2)
      expect(tool1Analytics?.anonymous_requests).toBe(1)

      const tool2Analytics = analytics.find(a => a.tool_id === 'tool-2')
      expect(tool2Analytics).toBeDefined()
      expect(tool2Analytics?.total_requests).toBe(1)
      expect(tool2Analytics?.successful_requests).toBe(1)
      expect(tool2Analytics?.failed_requests).toBe(0)
      expect(tool2Analytics?.unique_users).toBe(1)
      expect(tool2Analytics?.anonymous_requests).toBe(0)
    })

    it('should calculate performance metrics correctly', () => {
      const usages = [
        new ToolUsage(
          createMockToolUsage({
            tool_id: 'tool-1',
            status: 'success',
            execution_time_ms: 1000,
            input_size: 1000,
            output_size: 2000,
          })
        ),
        new ToolUsage(
          createMockToolUsage({
            tool_id: 'tool-1',
            status: 'success',
            execution_time_ms: 2000,
            input_size: 1500,
            output_size: 2500,
          })
        ),
        new ToolUsage(
          createMockToolUsage({
            tool_id: 'tool-1',
            status: 'error',
            execution_time_ms: 500,
            input_size: 500,
            output_size: 0,
          })
        ),
        new ToolUsage(
          createMockToolUsage({
            tool_id: 'tool-2',
            status: 'success',
            execution_time_ms: 1500,
            input_size: 2000,
            output_size: 3000,
          })
        ),
      ]

      const metrics = ToolUsage.getPerformanceMetrics(usages)

      expect(metrics.total_requests).toBe(4)
      expect(metrics.success_rate).toBe(75) // 3/4 success rate
      expect(metrics.avg_execution_time_ms).toBe(1500) // (1000 + 2000 + 1500) / 3
      expect(metrics.total_data_processed_bytes).toBe(13500) // sum of input + output sizes
      expect(metrics.most_used_tool_id).toBe('tool-1')
    })

    it('should handle empty usage list in performance metrics', () => {
      const metrics = ToolUsage.getPerformanceMetrics([])

      expect(metrics.total_requests).toBe(0)
      expect(metrics.success_rate).toBe(0)
      expect(metrics.avg_execution_time_ms).toBe(0)
      expect(metrics.p95_execution_time_ms).toBe(0)
      expect(metrics.total_data_processed_bytes).toBe(0)
      expect(metrics.most_used_tool_id).toBeNull()
    })

    it('should calculate p95 execution time correctly', () => {
      const executionTimes = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
      const usages = executionTimes.map(
        time =>
          new ToolUsage(
            createMockToolUsage({
              tool_id: 'tool-1',
              status: 'success',
              execution_time_ms: time,
              input_size: 1000,
              output_size: 2000,
            })
          )
      )

      const metrics = ToolUsage.getPerformanceMetrics(usages)

      // P95 of 10 values should be the 9th value (0-indexed), which is 900
      expect(metrics.p95_execution_time_ms).toBe(900)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing optional fields', () => {
      const minimalUsageData = {
        id: 'usage-123',
        user_id: null,
        tool_id: 'tool-123',
        input_size: 0,
        output_size: 0,
        execution_time_ms: null,
        status: 'success',
        error_message: null,
        ip_address: null,
        user_agent: null,
        created_at: 1234567890,
      }

      const usage = new ToolUsage(minimalUsageData)

      expect(usage.user_id).toBeNull()
      expect(usage.execution_time_ms).toBeNull()
      expect(usage.error_message).toBeNull()
      expect(usage.ip_address).toBeNull()
      expect(usage.user_agent).toBeNull()
    })

    it('should handle invalid data in fromRow', () => {
      const invalidRow = {
        id: 'invalid-uuid',
        user_id: 'invalid-uuid',
        tool_id: 'invalid-uuid',
        status: 'invalid',
        input_size: -1,
      }

      expect(() => ToolUsage.fromRow(invalidRow)).toThrow()
    })

    it('should handle zero input size in data transfer ratio', () => {
      const usage = new ToolUsage(createMockToolUsage({ input_size: 0, output_size: 1000 }))
      expect(usage.dataTransferRatio).toBe(0)
    })

    it('should handle negative sizes gracefully', () => {
      const usage = new ToolUsage(createMockToolUsage({ input_size: -100, output_size: -200 }))
      expect(usage.sizeString).toBe('-100 B → -200 B')
    })
  })

  describe('SQL Queries', () => {
    it('should have all required SQL queries', () => {
      expect(TOOL_USAGE_QUERIES.CREATE_TABLE).toBeDefined()
      expect(TOOL_USAGE_QUERIES.INSERT).toBeDefined()
      expect(TOOL_USAGE_QUERIES.SELECT_BY_ID).toBeDefined()
      expect(TOOL_USAGE_QUERIES.SELECT_BY_USER).toBeDefined()
      expect(TOOL_USAGE_QUERIES.SELECT_BY_TOOL).toBeDefined()
      expect(TOOL_USAGE_QUERIES.SELECT_BY_USER_AND_TOOL).toBeDefined()
      expect(TOOL_USAGE_QUERIES.SELECT_BY_DATE_RANGE).toBeDefined()
      expect(TOOL_USAGE_QUERIES.SELECT_RECENT).toBeDefined()
      expect(TOOL_USAGE_QUERIES.COUNT).toBeDefined()
      expect(TOOL_USAGE_QUERIES.COUNT_BY_USER).toBeDefined()
      expect(TOOL_USAGE_QUERIES.COUNT_BY_TOOL).toBeDefined()
      expect(TOOL_USAGE_QUERIES.COUNT_BY_STATUS).toBeDefined()
      expect(TOOL_USAGE_QUERIES.ANALYTICS_DAILY_BY_TOOL).toBeDefined()
    })

    it('should have proper table creation query', () => {
      expect(TOOL_USAGE_QUERIES.CREATE_TABLE).toContain('CREATE TABLE IF NOT EXISTS tool_usage')
      expect(TOOL_USAGE_QUERIES.CREATE_TABLE).toContain('id TEXT PRIMARY KEY')
      expect(TOOL_USAGE_QUERIES.CREATE_TABLE).toContain(
        'FOREIGN KEY (user_id) REFERENCES users(id)'
      )
      expect(TOOL_USAGE_QUERIES.CREATE_TABLE).toContain(
        'FOREIGN KEY (tool_id) REFERENCES tools(id)'
      )
    })

    it('should have proper index creation queries', () => {
      expect(TOOL_USAGE_QUERIES.CREATE_INDEXES).toHaveLength(5)
      expect(TOOL_USAGE_QUERIES.CREATE_INDEXES[0]).toContain('idx_tool_usage_user_id')
      expect(TOOL_USAGE_QUERIES.CREATE_INDEXES[1]).toContain('idx_tool_usage_tool_id')
      expect(TOOL_USAGE_QUERIES.CREATE_INDEXES[2]).toContain('idx_tool_usage_created_at')
      expect(TOOL_USAGE_QUERIES.CREATE_INDEXES[3]).toContain('idx_tool_usage_status')
      expect(TOOL_USAGE_QUERIES.CREATE_INDEXES[4]).toContain('idx_tool_usage_user_date')
    })

    it('should have parameterized queries', () => {
      expect(TOOL_USAGE_QUERIES.INSERT).toContain('VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      expect(TOOL_USAGE_QUERIES.SELECT_BY_ID).toContain('WHERE id = ?')
      expect(TOOL_USAGE_QUERIES.SELECT_BY_USER).toContain('WHERE user_id = ?')
      expect(TOOL_USAGE_QUERIES.DELETE).toContain('WHERE id = ?')
    })

    it('should have analytics query with proper grouping', () => {
      expect(TOOL_USAGE_QUERIES.ANALYTICS_DAILY_BY_TOOL).toContain(
        "GROUP BY tool_id, DATE(created_at, 'unixepoch')"
      )
      expect(TOOL_USAGE_QUERIES.ANALYTICS_DAILY_BY_TOOL).toContain('COUNT(*) as total_requests')
      expect(TOOL_USAGE_QUERIES.ANALYTICS_DAILY_BY_TOOL).toContain(
        "COUNT(CASE WHEN status = 'success' THEN 1 END)"
      )
    })
  })

  describe('Integration with Mock Database', () => {
    it('should work with mock database operations', async () => {
      const usageData = createMockToolUsage()
      mockDb.setTableData('tool_usage', [usageData])

      // Test SELECT by ID
      const selectStmt = mockDb.prepare(TOOL_USAGE_QUERIES.SELECT_BY_ID).bind(usageData.id)
      const result = await selectStmt.first()

      expect(result).toEqual(usageData)
    })

    it('should handle tool usage creation through mock database', async () => {
      const usageData = createMockToolUsage()

      // Test INSERT
      const insertStmt = mockDb
        .prepare(TOOL_USAGE_QUERIES.INSERT)
        .bind(
          usageData.id,
          usageData.user_id,
          usageData.tool_id,
          usageData.input_size,
          usageData.output_size,
          usageData.execution_time_ms,
          usageData.status,
          usageData.error_message,
          usageData.ip_address,
          usageData.user_agent,
          usageData.created_at
        )

      const result = await insertStmt.run()
      expect(result.success).toBe(true)
      expect(result.meta.changes).toBe(1)

      // Verify data was inserted
      const storedData = mockDb.getTableData('tool_usage')
      expect(storedData).toHaveLength(1)
      expect(storedData[0].id).toBe(usageData.id)
    })

    it('should handle tool usage lookup by user', async () => {
      const usageData = createMockToolUsage()
      mockDb.setTableData('tool_usage', [usageData])

      // Test SELECT by user
      const selectStmt = mockDb
        .prepare(TOOL_USAGE_QUERIES.SELECT_BY_USER)
        .bind(usageData.user_id, 10, 0)
      const result = await selectStmt.all()

      expect(result.results).toHaveLength(1)
      expect(result.results[0]).toEqual(usageData)
    })

    it('should handle tool usage lookup by tool', async () => {
      const usageData = createMockToolUsage()
      mockDb.setTableData('tool_usage', [usageData])

      // Test SELECT by tool
      const selectStmt = mockDb
        .prepare(TOOL_USAGE_QUERIES.SELECT_BY_TOOL)
        .bind(usageData.tool_id, 10, 0)
      const result = await selectStmt.all()

      expect(result.results).toHaveLength(1)
      expect(result.results[0]).toEqual(usageData)
    })

    it('should handle counting tool usage by user', async () => {
      const userId = 'user-123'
      const usages = [
        createMockToolUsage({ user_id: userId }),
        createMockToolUsage({ user_id: userId }),
      ]
      mockDb.setTableData('tool_usage', usages)

      // Test COUNT
      const countStmt = mockDb.prepare(TOOL_USAGE_QUERIES.COUNT_BY_USER).bind(userId)
      const result = await countStmt.first()

      expect(result.count).toBe(2)
    })

    it('should handle counting tool usage by status', async () => {
      const status = 'success'
      const usages = [
        createMockToolUsage({ status }),
        createMockToolUsage({ status }),
        createMockToolUsage({ status: 'error' }),
      ]
      mockDb.setTableData('tool_usage', usages)

      // Test COUNT
      const countStmt = mockDb.prepare(TOOL_USAGE_QUERIES.COUNT_BY_STATUS).bind(status)
      const result = await countStmt.first()

      expect(result.count).toBe(2)
    })
  })
})
