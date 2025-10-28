import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  CreateToolSchema,
  TOOL_QUERIES,
  Tool,
  ToolConfigSchema,
  ToolSchema,
  UpdateToolSchema,
} from '../../../../apps/api/src/models/tool'
import {
  cleanupTestEnvironment,
  createMockTool,
  createTestDatabase,
  setupTestEnvironment,
} from './database.mock'

describe('Tool Model', () => {
  let mockDb: any

  beforeEach(() => {
    setupTestEnvironment()
    mockDb = createTestDatabase()
  })

  afterEach(() => {
    cleanupTestEnvironment()
  })

  describe('Schema Validation', () => {
    it('should validate a complete tool object', () => {
      const toolData = createMockTool()
      const result = ToolSchema.safeParse(toolData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe(toolData.id)
        expect(result.data.slug).toBe(toolData.slug)
        expect(result.data.category).toBe(toolData.category)
      }
    })

    it('should reject invalid slug format', () => {
      const invalidTool = createMockTool({ slug: 'Invalid Slug!' })
      const result = ToolSchema.safeParse(invalidTool)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('slug')
      }
    })

    it('should reject invalid category', () => {
      const invalidTool = createMockTool({ category: 'invalid' })
      const result = ToolSchema.safeParse(invalidTool)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('category')
      }
    })

    it('should accept valid categories', () => {
      const validCategories = [
        'json',
        'formatting',
        'execution',
        'text',
        'image',
        'network',
        'crypto',
      ]

      validCategories.forEach(category => {
        const tool = createMockTool({ category: category as any })
        const result = ToolSchema.safeParse(tool)
        expect(result.success).toBe(true)
      })
    })

    it('should accept valid execution modes', () => {
      const validModes = ['sync', 'async', 'streaming']

      validModes.forEach(mode => {
        const config = {
          inputSchema: { type: 'string' },
          outputSchema: { type: 'string' },
          executionMode: mode,
          quotas: {
            maxInputSize: 1024,
            maxExecutionTime: 5000,
            requiresAuth: false,
          },
          parameters: [],
        }
        const result = ToolConfigSchema.safeParse(config)
        expect(result.success).toBe(true)
      })
    })

    it('should validate tool creation schema', () => {
      const createData = {
        slug: 'test-tool',
        name: 'Test Tool',
        category: 'json' as const,
        description: 'A test tool',
        config: {
          inputSchema: { type: 'string' },
          outputSchema: { type: 'string' },
          executionMode: 'sync' as const,
          quotas: {
            maxInputSize: 1024,
            maxExecutionTime: 5000,
            requiresAuth: false,
          },
          parameters: [],
        },
      }

      const result = CreateToolSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })

    it('should validate tool update schema', () => {
      const updateData = {
        name: 'Updated Tool',
        description: 'Updated description',
        enabled: false,
        beta: true,
      }

      const result = UpdateToolSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })
  })

  describe('Model Creation and Instantiation', () => {
    it('should create a tool instance with valid data', () => {
      const toolData = createMockTool()
      const tool = new Tool(toolData)

      expect(tool.id).toBe(toolData.id)
      expect(tool.slug).toBe(toolData.slug)
      expect(tool.name).toBe(toolData.name)
      expect(tool.category).toBe(toolData.category)
      expect(tool.enabled).toBe(toolData.enabled)
      expect(tool.beta).toBe(toolData.beta)
    })

    it('should create a tool with static create method', () => {
      const createData = {
        slug: 'new-tool',
        name: 'New Tool',
        category: 'execution' as const,
        description: 'A new tool',
        config: {
          inputSchema: { type: 'object' },
          outputSchema: { type: 'object' },
          executionMode: 'async' as const,
          quotas: {
            maxInputSize: 2048,
            maxExecutionTime: 10000,
            requiresAuth: true,
          },
          parameters: [],
        },
      }

      const tool = Tool.create(createData)

      expect(tool.id).toBeDefined()
      expect(tool.slug).toBe(createData.slug)
      expect(tool.name).toBe(createData.name)
      expect(tool.category).toBe(createData.category)
      expect(tool.enabled).toBe(true)
      expect(tool.beta).toBe(false)
      expect(tool.sort_order).toBe(0)
      expect(tool.created_at).toBeDefined()
      expect(tool.updated_at).toBeDefined()
    })

    it('should create tool from database row', () => {
      const rowData = createMockTool()
      mockDb.setTableData('tools', [rowData])

      const tool = Tool.fromRow(rowData)

      expect(tool).toBeInstanceOf(Tool)
      expect(tool.id).toBe(rowData.id)
      expect(tool.slug).toBe(rowData.slug)
      expect(tool.config).toEqual(JSON.parse(rowData.config))
    })

    it('should parse JSON config in fromRow', () => {
      const config = {
        inputSchema: { type: 'string' },
        outputSchema: { type: 'string' },
        executionMode: 'sync',
        quotas: {
          maxInputSize: 1024,
          maxExecutionTime: 5000,
          requiresAuth: false,
        },
        parameters: [],
      }
      const rowData = createMockTool({
        config: JSON.stringify(config),
      })

      const tool = Tool.fromRow(rowData)
      expect(tool.config).toEqual(config)
    })

    it('should handle invalid JSON in config', () => {
      const rowData = createMockTool({
        config: 'invalid json string',
      })

      expect(() => Tool.fromRow(rowData)).toThrow()
    })
  })

  describe('Database Operations', () => {
    it('should convert tool to database row format', () => {
      const config = {
        inputSchema: { type: 'string' },
        outputSchema: { type: 'string' },
        executionMode: 'sync',
        quotas: {
          maxInputSize: 1024,
          maxExecutionTime: 5000,
          requiresAuth: false,
        },
        parameters: [],
      }
      const toolData = createMockTool({ config })
      const tool = new Tool(toolData)

      const row = tool.toRow()

      expect(row.id).toBe(tool.id)
      expect(row.slug).toBe(tool.slug)
      expect(row.config).toBe(JSON.stringify(config))
      expect(row.enabled).toBe(tool.enabled)
      expect(row.beta).toBe(tool.beta)
    })

    it('should update tool data', () => {
      const toolData = createMockTool()
      const tool = new Tool(toolData)
      const originalUpdatedAt = tool.updated_at

      setTimeout(() => {
        const updateData = {
          name: 'Updated Tool',
          description: 'Updated description',
          enabled: false,
        }

        const updatedTool = tool.update(updateData)

        expect(updatedTool.name).toBe(updateData.name)
        expect(updatedTool.description).toBe(updateData.description)
        expect(updatedTool.enabled).toBe(updateData.enabled)
        expect(updatedTool.updated_at).toBeGreaterThan(originalUpdatedAt)
        expect(updatedTool.slug).toBe(tool.slug) // Unchanged field
      }, 10)
    })

    it('should enable tool', () => {
      const toolData = createMockTool({ enabled: false })
      const tool = new Tool(toolData)

      const enabledTool = tool.enable()
      expect(enabledTool.enabled).toBe(true)
    })

    it('should disable tool', () => {
      const toolData = createMockTool({ enabled: true })
      const tool = new Tool(toolData)

      const disabledTool = tool.disable()
      expect(disabledTool.enabled).toBe(false)
    })

    it('should mark tool as beta', () => {
      const toolData = createMockTool({ beta: false })
      const tool = new Tool(toolData)

      const betaTool = tool.markAsBeta()
      expect(betaTool.beta).toBe(true)
    })

    it('should mark tool as stable', () => {
      const toolData = createMockTool({ beta: true })
      const tool = new Tool(toolData)

      const stableTool = tool.markAsStable()
      expect(stableTool.beta).toBe(false)
    })

    it('should set sort order', () => {
      const toolData = createMockTool({ sort_order: 0 })
      const tool = new Tool(toolData)

      const reorderedTool = tool.setSortOrder(5)
      expect(reorderedTool.sort_order).toBe(5)
    })
  })

  describe('Helper Methods and Business Logic', () => {
    it('should correctly determine tool availability', () => {
      const enabledTool = new Tool(createMockTool({ enabled: true, beta: false }))
      const disabledTool = new Tool(createMockTool({ enabled: false, beta: false }))
      const betaTool = new Tool(createMockTool({ enabled: true, beta: true }))

      expect(enabledTool.isAvailable).toBe(true)
      expect(disabledTool.isAvailable).toBe(false)
      expect(betaTool.isAvailable).toBe(false) // Beta features disabled by default
    })

    it('should make beta tools available when ENABLE_BETA_FEATURES is true', () => {
      const originalEnv = process.env.ENABLE_BETA_FEATURES
      process.env.ENABLE_BETA_FEATURES = 'true'

      const betaTool = new Tool(createMockTool({ enabled: true, beta: true }))
      expect(betaTool.isAvailable).toBe(true)

      process.env.ENABLE_BETA_FEATURES = originalEnv
    })

    it('should return correct max input size', () => {
      const config = {
        inputSchema: { type: 'string' },
        outputSchema: { type: 'string' },
        executionMode: 'sync' as const,
        quotas: {
          maxInputSize: 2048,
          maxExecutionTime: 5000,
          requiresAuth: false,
        },
        parameters: [],
      }
      const tool = new Tool(createMockTool({ config }))

      expect(tool.maxInputSize).toBe(2048)
    })

    it('should return correct max execution time', () => {
      const config = {
        inputSchema: { type: 'string' },
        outputSchema: { type: 'string' },
        executionMode: 'sync' as const,
        quotas: {
          maxInputSize: 1024,
          maxExecutionTime: 15000,
          requiresAuth: false,
        },
        parameters: [],
      }
      const tool = new Tool(createMockTool({ config }))

      expect(tool.maxExecutionTime).toBe(15000)
    })

    it('should return correct auth requirement', () => {
      const publicToolConfig = {
        inputSchema: { type: 'string' },
        outputSchema: { type: 'string' },
        executionMode: 'sync' as const,
        quotas: {
          maxInputSize: 1024,
          maxExecutionTime: 5000,
          requiresAuth: false,
        },
        parameters: [],
      }
      const privateToolConfig = {
        inputSchema: { type: 'string' },
        outputSchema: { type: 'string' },
        executionMode: 'sync' as const,
        quotas: {
          maxInputSize: 1024,
          maxExecutionTime: 5000,
          requiresAuth: true,
        },
        parameters: [],
      }

      const publicTool = new Tool(createMockTool({ config: publicToolConfig }))
      const privateTool = new Tool(createMockTool({ config: privateToolConfig }))

      expect(publicTool.requiresAuth).toBe(false)
      expect(privateTool.requiresAuth).toBe(true)
    })

    it('should return correct execution mode', () => {
      const syncConfig = {
        inputSchema: { type: 'string' },
        outputSchema: { type: 'string' },
        executionMode: 'sync' as const,
        quotas: {
          maxInputSize: 1024,
          maxExecutionTime: 5000,
          requiresAuth: false,
        },
        parameters: [],
      }
      const asyncConfig = {
        inputSchema: { type: 'string' },
        outputSchema: { type: 'string' },
        executionMode: 'async' as const,
        quotas: {
          maxInputSize: 1024,
          maxExecutionTime: 5000,
          requiresAuth: false,
        },
        parameters: [],
      }

      const syncTool = new Tool(createMockTool({ config: syncConfig }))
      const asyncTool = new Tool(createMockTool({ config: asyncConfig }))

      expect(syncTool.executionMode).toBe('sync')
      expect(asyncTool.executionMode).toBe('async')
    })

    it('should correctly identify asynchronous tools', () => {
      const syncConfig = {
        inputSchema: { type: 'string' },
        outputSchema: { type: 'string' },
        executionMode: 'sync' as const,
        quotas: {
          maxInputSize: 1024,
          maxExecutionTime: 5000,
          requiresAuth: false,
        },
        parameters: [],
      }
      const asyncConfig = {
        inputSchema: { type: 'string' },
        outputSchema: { type: 'string' },
        executionMode: 'async' as const,
        quotas: {
          maxInputSize: 1024,
          maxExecutionTime: 5000,
          requiresAuth: false,
        },
        parameters: [],
      }
      const streamingConfig = {
        inputSchema: { type: 'string' },
        outputSchema: { type: 'string' },
        executionMode: 'streaming' as const,
        quotas: {
          maxInputSize: 1024,
          maxExecutionTime: 5000,
          requiresAuth: false,
        },
        parameters: [],
      }

      const syncTool = new Tool(createMockTool({ config: syncConfig }))
      const asyncTool = new Tool(createMockTool({ config: asyncConfig }))
      const streamingTool = new Tool(createMockTool({ config: streamingConfig }))

      expect(syncTool.isAsynchronous).toBe(false)
      expect(asyncTool.isAsynchronous).toBe(true)
      expect(streamingTool.isAsynchronous).toBe(true)
    })

    it('should validate input correctly', () => {
      const config = {
        inputSchema: { type: 'object' },
        outputSchema: { type: 'object' },
        executionMode: 'sync' as const,
        quotas: {
          maxInputSize: 1024,
          maxExecutionTime: 5000,
          requiresAuth: false,
        },
        parameters: [
          {
            name: 'required_param',
            type: 'string',
            required: true,
            description: 'A required parameter',
          },
          {
            name: 'optional_param',
            type: 'number',
            required: false,
            description: 'An optional parameter',
          },
        ],
      }
      const tool = new Tool(createMockTool({ config }))

      // Valid input
      const validInput = { required_param: 'test value', optional_param: 42 }
      const validResult = tool.validateInput(validInput)
      expect(validResult.valid).toBe(true)

      // Missing required parameter
      const invalidInput = { optional_param: 42 }
      const invalidResult = tool.validateInput(invalidInput)
      expect(invalidResult.valid).toBe(false)
      expect(invalidResult.errors).toContain('Missing required parameter: required_param')

      // Wrong type
      const wrongTypeInput = { required_param: 123 }
      const wrongTypeResult = tool.validateInput(wrongTypeInput)
      expect(wrongTypeResult.valid).toBe(false)
      expect(wrongTypeResult.errors).toContain('Input must be an object')
    })

    it('should validate output correctly', () => {
      const config = {
        inputSchema: { type: 'string' },
        outputSchema: { type: 'object' },
        executionMode: 'sync' as const,
        quotas: {
          maxInputSize: 1024,
          maxExecutionTime: 5000,
          requiresAuth: false,
        },
        parameters: [],
      }
      const tool = new Tool(createMockTool({ config }))

      // Valid output
      const validOutput = { result: 'success' }
      const validResult = tool.validateOutput(validOutput)
      expect(validResult.valid).toBe(true)

      // Invalid output type
      const invalidOutput = 'invalid string'
      const invalidResult = tool.validateOutput(invalidOutput)
      expect(invalidResult.valid).toBe(false)
      expect(invalidResult.errors).toContain('Output must be an object')
    })

    it('should return parameter schema', () => {
      const parameters = [
        {
          name: 'param1',
          type: 'string',
          required: true,
          description: 'First parameter',
        },
        {
          name: 'param2',
          type: 'number',
          required: false,
          default: 42,
          description: 'Second parameter',
        },
      ]
      const config = {
        inputSchema: { type: 'object' },
        outputSchema: { type: 'object' },
        executionMode: 'sync' as const,
        quotas: {
          maxInputSize: 1024,
          maxExecutionTime: 5000,
          requiresAuth: false,
        },
        parameters,
      }
      const tool = new Tool(createMockTool({ config }))

      const paramSchema = tool.getParameterSchema()
      expect(paramSchema).toEqual(parameters)
    })
  })

  describe('Factory Methods', () => {
    it('should create JSON formatter tool', () => {
      const tool = Tool.createJsonFormatter()

      expect(tool.slug).toBe('json-format')
      expect(tool.name).toBe('JSON Formatter')
      expect(tool.category).toBe('json')
      expect(tool.executionMode).toBe('sync')
      expect(tool.requiresAuth).toBe(false)
      expect(tool.maxInputSize).toBe(1024 * 1024)
      expect(tool.maxExecutionTime).toBe(1000)
    })

    it('should create JSON validator tool', () => {
      const tool = Tool.createJsonValidator()

      expect(tool.slug).toBe('json-validate')
      expect(tool.name).toBe('JSON Validator')
      expect(tool.category).toBe('json')
      expect(tool.executionMode).toBe('sync')
      expect(tool.requiresAuth).toBe(false)
      expect(tool.maxInputSize).toBe(1024 * 1024)
      expect(tool.maxExecutionTime).toBe(2000)
    })

    it('should create code executor tool', () => {
      const tool = Tool.createCodeExecutor()

      expect(tool.slug).toBe('code-execute')
      expect(tool.name).toBe('Code Executor')
      expect(tool.category).toBe('execution')
      expect(tool.executionMode).toBe('async')
      expect(tool.requiresAuth).toBe(true)
      expect(tool.maxInputSize).toBe(100 * 1024)
      expect(tool.maxExecutionTime).toBe(10000)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing optional fields', () => {
      const minimalToolData = {
        id: 'tool-123',
        slug: 'minimal-tool',
        name: 'Minimal Tool',
        category: 'json',
        description: null,
        config: JSON.stringify({
          inputSchema: {},
          outputSchema: {},
          executionMode: 'sync',
          quotas: {
            maxInputSize: 1024,
            maxExecutionTime: 5000,
            requiresAuth: false,
          },
          parameters: [],
        }),
        enabled: true,
        beta: false,
        sort_order: 0,
        created_at: 1234567890,
        updated_at: 1234567890,
      }

      const tool = new Tool(minimalToolData)

      expect(tool.description).toBeNull()
      expect(tool.enabled).toBe(true)
      expect(tool.beta).toBe(false)
    })

    it('should handle invalid data in fromRow', () => {
      const invalidRow = {
        id: 'invalid-uuid',
        slug: 'invalid slug!',
        name: 'Test Tool',
        category: 'invalid',
        config: '{}',
      }

      expect(() => Tool.fromRow(invalidRow)).toThrow()
    })

    it('should handle empty config', () => {
      const config = {
        inputSchema: {},
        outputSchema: {},
        executionMode: 'sync' as const,
        quotas: {
          maxInputSize: 1024,
          maxExecutionTime: 5000,
          requiresAuth: false,
        },
        parameters: [],
      }
      const tool = new Tool(createMockTool({ config }))

      expect(tool.config).toEqual(config)
      expect(tool.validateInput({}).valid).toBe(true)
      expect(tool.validateOutput({}).valid).toBe(true)
    })

    it('should handle complex parameter schemas', () => {
      const parameters = [
        {
          name: 'complex_param',
          type: 'object',
          required: true,
          description: 'A complex parameter',
          default: null,
        },
        {
          name: 'array_param',
          type: 'array',
          required: false,
          description: 'An array parameter',
          default: [],
        },
      ]
      const config = {
        inputSchema: { type: 'object' },
        outputSchema: { type: 'object' },
        executionMode: 'sync' as const,
        quotas: {
          maxInputSize: 1024,
          maxExecutionTime: 5000,
          requiresAuth: false,
        },
        parameters,
      }
      const tool = new Tool(createMockTool({ config }))

      const paramSchema = tool.getParameterSchema()
      expect(paramSchema).toHaveLength(2)
      expect(paramSchema[0].name).toBe('complex_param')
      expect(paramSchema[1].type).toBe('array')
    })
  })

  describe('SQL Queries', () => {
    it('should have all required SQL queries', () => {
      expect(TOOL_QUERIES.CREATE_TABLE).toBeDefined()
      expect(TOOL_QUERIES.INSERT).toBeDefined()
      expect(TOOL_QUERIES.SELECT_BY_ID).toBeDefined()
      expect(TOOL_QUERIES.SELECT_BY_SLUG).toBeDefined()
      expect(TOOL_QUERIES.SELECT_ENABLED).toBeDefined()
      expect(TOOL_QUERIES.SELECT_BY_CATEGORY).toBeDefined()
      expect(TOOL_QUERIES.SELECT_BETA).toBeDefined()
      expect(TOOL_QUERIES.UPDATE).toBeDefined()
      expect(TOOL_QUERIES.DELETE).toBeDefined()
      expect(TOOL_QUERIES.LIST).toBeDefined()
      expect(TOOL_QUERIES.LIST_BY_CATEGORY).toBeDefined()
      expect(TOOL_QUERIES.COUNT).toBeDefined()
      expect(TOOL_QUERIES.COUNT_BY_CATEGORY).toBeDefined()
    })

    it('should have proper table creation query', () => {
      expect(TOOL_QUERIES.CREATE_TABLE).toContain('CREATE TABLE IF NOT EXISTS tools')
      expect(TOOL_QUERIES.CREATE_TABLE).toContain('id TEXT PRIMARY KEY')
      expect(TOOL_QUERIES.CREATE_TABLE).toContain('slug TEXT UNIQUE NOT NULL')
    })

    it('should have proper index creation queries', () => {
      expect(TOOL_QUERIES.CREATE_INDEXES).toHaveLength(4)
      expect(TOOL_QUERIES.CREATE_INDEXES[0]).toContain('idx_tools_category')
      expect(TOOL_QUERIES.CREATE_INDEXES[1]).toContain('idx_tools_enabled')
      expect(TOOL_QUERIES.CREATE_INDEXES[2]).toContain('idx_tools_sort')
      expect(TOOL_QUERIES.CREATE_INDEXES[3]).toContain('idx_tools_slug')
    })

    it('should have parameterized queries', () => {
      expect(TOOL_QUERIES.INSERT).toContain('VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      expect(TOOL_QUERIES.SELECT_BY_ID).toContain('WHERE id = ?')
      expect(TOOL_QUERIES.SELECT_BY_SLUG).toContain('WHERE slug = ?')
      expect(TOOL_QUERIES.DELETE).toContain('WHERE id = ?')
    })
  })

  describe('Integration with Mock Database', () => {
    it('should work with mock database operations', async () => {
      const toolData = createMockTool()
      mockDb.setTableData('tools', [toolData])

      // Test SELECT by ID
      const selectStmt = mockDb.prepare(TOOL_QUERIES.SELECT_BY_ID).bind(toolData.id)
      const result = await selectStmt.first()

      expect(result).toEqual(toolData)
    })

    it('should handle tool creation through mock database', async () => {
      const toolData = createMockTool()

      // Test INSERT
      const insertStmt = mockDb
        .prepare(TOOL_QUERIES.INSERT)
        .bind(
          toolData.id,
          toolData.slug,
          toolData.name,
          toolData.category,
          toolData.description,
          toolData.config,
          toolData.enabled,
          toolData.beta,
          toolData.sort_order,
          toolData.created_at,
          toolData.updated_at
        )

      const result = await insertStmt.run()
      expect(result.success).toBe(true)
      expect(result.meta.changes).toBe(1)

      // Verify data was inserted
      const storedData = mockDb.getTableData('tools')
      expect(storedData).toHaveLength(1)
      expect(storedData[0].id).toBe(toolData.id)
    })

    it('should handle tool lookup by slug', async () => {
      const toolData = createMockTool()
      mockDb.setTableData('tools', [toolData])

      // Test SELECT by slug
      const selectStmt = mockDb.prepare(TOOL_QUERIES.SELECT_BY_SLUG).bind(toolData.slug)
      const result = await selectStmt.first()

      expect(result).toEqual(toolData)
    })

    it('should handle tool lookup by category', async () => {
      const toolData = createMockTool({ category: 'json' })
      mockDb.setTableData('tools', [toolData])

      // Test SELECT by category
      const selectStmt = mockDb
        .prepare(TOOL_QUERIES.SELECT_BY_CATEGORY)
        .bind(toolData.category, 10, 0)
      const result = await selectStmt.all()

      expect(result.results).toHaveLength(1)
      expect(result.results[0]).toEqual(toolData)
    })

    it('should handle tool updates through mock database', async () => {
      const toolData = createMockTool()
      mockDb.setTableData('tools', [toolData])

      const updatedName = 'Updated Tool Name'
      const now = Math.floor(Date.now() / 1000)

      // Test UPDATE
      const updateStmt = mockDb
        .prepare(TOOL_QUERIES.UPDATE)
        .bind(
          updatedName,
          toolData.category,
          toolData.description,
          toolData.config,
          toolData.enabled,
          toolData.beta,
          toolData.sort_order,
          now,
          toolData.id
        )

      const result = await updateStmt.run()
      expect(result.success).toBe(true)
      expect(result.meta.changes).toBe(1)
    })

    it('should handle tool deletion through mock database', async () => {
      const toolData = createMockTool()
      mockDb.setTableData('tools', [toolData])

      // Test DELETE
      const deleteStmt = mockDb.prepare(TOOL_QUERIES.DELETE).bind(toolData.id)
      const result = await deleteStmt.run()

      expect(result.success).toBe(true)
      expect(result.meta.changes).toBe(1)

      // Verify data was deleted
      const storedData = mockDb.getTableData('tools')
      expect(storedData).toHaveLength(0)
    })

    it('should handle counting tools by category', async () => {
      const category = 'json'
      const tools = [createMockTool({ category }), createMockTool({ category })]
      mockDb.setTableData('tools', tools)

      // Test COUNT
      const countStmt = mockDb.prepare(TOOL_QUERIES.COUNT_BY_CATEGORY).bind(category)
      const result = await countStmt.first()

      expect(result.count).toBe(2)
    })
  })
})
