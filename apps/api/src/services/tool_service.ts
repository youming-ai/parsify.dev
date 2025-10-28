import { createDatabaseClient, type DatabaseClient } from '../database'
import { AUDIT_LOG_QUERIES, AuditLog } from '../models/audit_log'
import { Job } from '../models/job'
import { QUOTA_COUNTER_QUERIES, QuotaCounter } from '../models/quota_counter'
import { CreateToolSchema, TOOL_QUERIES, Tool, UpdateToolSchema } from '../models/tool'
import { TOOL_USAGE_QUERIES, ToolUsage } from '../models/tool_usage'
import type { CloudflareService } from './cloudflare/cloudflare-service'
import type { KVCacheService } from './cloudflare/kv-cache'

export interface ToolServiceOptions {
  db: D1Database
  kv: KVNamespace
  auditEnabled?: boolean
  enableBetaFeatures?: boolean
  databaseConfig?: {
    maxConnections?: number
    connectionTimeoutMs?: number
    retryAttempts?: number
    enableMetrics?: boolean
  }
  cloudflareService?: CloudflareService
  enableAdvancedCaching?: boolean
}

export interface ToolExecutionOptions {
  input: any
  userId?: string
  ipAddress: string
  userAgent: string
  timeout?: number
  validateInput?: boolean
  trackUsage?: boolean
}

export interface ToolExecutionResult {
  success: boolean
  output?: any
  error?: string
  executionTime?: number
  jobId?: string // For async tools
  quotaRemaining?: number
  quotaLimit?: number
}

export interface ToolStats {
  toolId: string
  name: string
  category: string
  totalUsage: number
  successRate: number
  avgExecutionTime: number
  lastUsed: number
}

export class ToolService {
  private db: D1Database
  private client: DatabaseClient
  private kv: KVNamespace
  private auditEnabled: boolean
  private enableBetaFeatures: boolean
  private toolCache: Map<string, Tool> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  private cloudflareService: CloudflareService | null
  private cacheService: KVCacheService | null
  private enableAdvancedCaching: boolean

  constructor(options: ToolServiceOptions) {
    this.db = options.db
    this.client = createDatabaseClient(this.db, options.databaseConfig)
    this.kv = options.kv
    this.auditEnabled = options.auditEnabled ?? true
    this.enableBetaFeatures = options.enableBetaFeatures ?? false
    this.cloudflareService = options.cloudflareService || null
    this.enableAdvancedCaching = options.enableAdvancedCaching ?? true
    this.cacheService = this.cloudflareService?.getKVCacheService() || null
  }

  // Tool CRUD operations
  async createTool(toolData: any): Promise<Tool> {
    const validatedData = CreateToolSchema.parse(toolData)
    const tool = Tool.create(validatedData)

    try {
      await this.client.execute(TOOL_QUERIES.INSERT, [
        tool.id,
        tool.slug,
        tool.name,
        tool.category,
        tool.description,
        JSON.stringify(tool.config),
        tool.enabled,
        tool.beta,
        tool.sort_order,
        tool.created_at,
        tool.updated_at,
      ])

      // Clear cache
      this.toolCache.clear()

      // Log audit event
      if (this.auditEnabled) {
        await this.logAudit({
          action: 'admin_action',
          resource_type: 'tool',
          resource_id: tool.id,
          new_values: { name: tool.name, category: tool.category },
          ipAddress: 'system',
          userAgent: 'tool-service',
        })
      }

      return tool
    } catch (error) {
      throw new Error(`Failed to create tool: ${error}`)
    }
  }

  async getToolById(toolId: string): Promise<Tool | null> {
    // Try enhanced cache first
    if (this.cacheService && this.enableAdvancedCaching) {
      return this.cacheService.getOrSet(
        `tool:${toolId}`,
        async () => {
          try {
            const result = await this.client.queryFirst(TOOL_QUERIES.SELECT_BY_ID, [toolId])
            return result ? Tool.fromRow(result) : null
          } catch (error) {
            throw new Error(`Failed to get tool: ${error}`)
          }
        },
        {
          namespace: 'cache',
          ttl: 1800, // 30 minutes
          tags: ['tool', `tool_id:${toolId}`],
          staleWhileRevalidate: true,
          dependencies: ['tools_list'],
        }
      )
    }

    // Fallback to local cache
    const cached = this.toolCache.get(toolId)
    if (cached && !this.isCacheExpired(toolId)) {
      return cached
    }

    try {
      const result = await this.client.queryFirst(TOOL_QUERIES.SELECT_BY_ID, [toolId])

      if (!result) {
        return null
      }

      const tool = Tool.fromRow(result)
      this.toolCache.set(toolId, tool)
      this.cacheExpiry.set(toolId, Date.now() + 5 * 60 * 1000) // 5 minutes

      return tool
    } catch (error) {
      throw new Error(`Failed to get tool: ${error}`)
    }
  }

  async getToolBySlug(slug: string): Promise<Tool | null> {
    // Try enhanced cache first
    if (this.cacheService && this.enableAdvancedCaching) {
      return this.cacheService.getOrSet(
        `tool_by_slug:${slug}`,
        async () => {
          try {
            const result = await this.client.queryFirst(TOOL_QUERIES.SELECT_BY_SLUG, [slug])
            return result ? Tool.fromRow(result) : null
          } catch (error) {
            throw new Error(`Failed to get tool by slug: ${error}`)
          }
        },
        {
          namespace: 'cache',
          ttl: 1800, // 30 minutes
          tags: ['tool', 'slug_lookup'],
          staleWhileRevalidate: true,
          dependencies: ['tools_list'],
        }
      )
    }

    // Fallback to local cache
    for (const [toolId, tool] of this.toolCache) {
      if (tool.slug === slug && !this.isCacheExpired(toolId)) {
        return tool
      }
    }

    try {
      const result = await this.client.queryFirst(TOOL_QUERIES.SELECT_BY_SLUG, [slug])

      if (!result) {
        return null
      }

      const tool = Tool.fromRow(result)
      this.toolCache.set(tool.id, tool)
      this.cacheExpiry.set(tool.id, Date.now() + 5 * 60 * 1000) // 5 minutes

      return tool
    } catch (error) {
      throw new Error(`Failed to get tool by slug: ${error}`)
    }
  }

  async updateTool(toolId: string, toolData: any): Promise<Tool> {
    const existingTool = await this.getToolById(toolId)
    if (!existingTool) {
      throw new Error(`Tool with ID ${toolId} not found`)
    }

    const validatedData = UpdateToolSchema.parse(toolData)
    const updatedTool = existingTool.update(validatedData)

    try {
      await this.client.execute(TOOL_QUERIES.UPDATE, [
        updatedTool.name,
        updatedTool.category,
        updatedTool.description,
        JSON.stringify(updatedTool.config),
        updatedTool.enabled,
        updatedTool.beta,
        updatedTool.sort_order,
        updatedTool.updated_at,
        updatedTool.id,
      ])

      // Update cache
      this.toolCache.set(toolId, updatedTool)

      // Log audit event
      if (this.auditEnabled) {
        await this.logAudit({
          action: 'admin_action',
          resource_type: 'tool',
          resource_id: toolId,
          old_values: {
            name: existingTool.name,
            enabled: existingTool.enabled,
          },
          new_values: { name: updatedTool.name, enabled: updatedTool.enabled },
          ipAddress: 'system',
          userAgent: 'tool-service',
        })
      }

      return updatedTool
    } catch (error) {
      throw new Error(`Failed to update tool: ${error}`)
    }
  }

  async deleteTool(toolId: string): Promise<void> {
    const existingTool = await this.getToolById(toolId)
    if (!existingTool) {
      throw new Error(`Tool with ID ${toolId} not found`)
    }

    try {
      await this.client.execute(TOOL_QUERIES.DELETE, [toolId])

      // Clear cache
      this.toolCache.delete(toolId)
      this.cacheExpiry.delete(toolId)

      // Log audit event
      if (this.auditEnabled) {
        await this.logAudit({
          action: 'data_delete',
          resource_type: 'tool',
          resource_id: toolId,
          old_values: {
            name: existingTool.name,
            category: existingTool.category,
          },
          ipAddress: 'system',
          userAgent: 'tool-service',
        })
      }
    } catch (error) {
      throw new Error(`Failed to delete tool: ${error}`)
    }
  }

  // Tool listing and filtering
  async getTools(category?: string, enabledOnly = true): Promise<Tool[]> {
    const cacheKey = `tools:${category || 'all'}:${enabledOnly ? 'enabled' : 'all'}`

    // Try enhanced cache first
    if (this.cacheService && this.enableAdvancedCaching) {
      return this.cacheService.getOrSet(
        cacheKey,
        async () => {
          return this.fetchToolsFromDatabase(category, enabledOnly)
        },
        {
          namespace: 'cache',
          ttl: 900, // 15 minutes
          tags: ['tools_list', `category:${category || 'all'}`],
          staleWhileRevalidate: true,
        }
      )
    }

    // Fallback to database
    return this.fetchToolsFromDatabase(category, enabledOnly)
  }

  private async fetchToolsFromDatabase(category?: string, enabledOnly = true): Promise<Tool[]> {
    try {
      let tools: any[]

      if (category) {
        tools = await this.client.query(TOOL_QUERIES.SELECT_BY_CATEGORY, [category])
      } else {
        tools = await this.client.query(TOOL_QUERIES.SELECT_ENABLED)
      }

      let toolObjects = tools.map(row => Tool.fromRow(row))

      // Filter based on beta features and enabled status
      toolObjects = toolObjects.filter(tool => {
        if (!this.enableBetaFeatures && tool.beta) {
          return false
        }
        if (enabledOnly && !tool.enabled) {
          return false
        }
        return true
      })

      // Sort by sort_order and name
      toolObjects.sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order
        }
        return a.name.localeCompare(b.name)
      })

      return toolObjects
    } catch (error) {
      throw new Error(`Failed to get tools: ${error}`)
    }
  }

  async getBetaTools(): Promise<Tool[]> {
    try {
      const stmt = this.db.prepare(TOOL_QUERIES.SELECT_BETA)
      const result = await stmt.all()

      return result.results.map(row => Tool.fromRow(row))
    } catch (error) {
      throw new Error(`Failed to get beta tools: ${error}`)
    }
  }

  async searchTools(query: string): Promise<Tool[]> {
    try {
      const searchQuery = `%${query}%`
      const tools = await this.client.query(
        `
        SELECT * FROM tools
        WHERE (name LIKE ? OR description LIKE ? OR slug LIKE ?)
        AND enabled = true
        ORDER BY sort_order ASC, name ASC
      `,
        [searchQuery, searchQuery, searchQuery]
      )

      let toolObjects = tools.map(row => Tool.fromRow(row))

      // Filter beta tools if not enabled
      if (!this.enableBetaFeatures) {
        toolObjects = toolObjects.filter(tool => !tool.beta)
      }

      return toolObjects
    } catch (error) {
      throw new Error(`Failed to search tools: ${error}`)
    }
  }

  // Tool execution
  async executeTool(toolId: string, options: ToolExecutionOptions): Promise<ToolExecutionResult> {
    const tool = await this.getToolById(toolId)
    if (!tool) {
      return { success: false, error: 'Tool not found' }
    }

    // Check if tool is available
    if (!tool.isAvailable) {
      return { success: false, error: 'Tool is not available' }
    }

    // Check quota
    const quotaCheck = await this.checkQuota(tool, options.userId, options.ipAddress)
    if (!quotaCheck.allowed) {
      return {
        success: false,
        error: 'Quota exceeded',
        quotaRemaining: quotaCheck.remaining,
        quotaLimit: quotaCheck.limit,
      }
    }

    // Validate input if required
    if (options.validateInput !== false) {
      const validation = tool.validateInput(options.input)
      if (!validation.valid) {
        return {
          success: false,
          error: `Invalid input: ${validation.errors?.join(', ')}`,
        }
      }
    }

    const startTime = Date.now()

    try {
      // Execute tool based on execution mode
      let result: ToolExecutionResult

      switch (tool.executionMode) {
        case 'sync':
          result = await this.executeSyncTool(tool, options)
          break
        case 'async':
          result = await this.executeAsyncTool(tool, options)
          break
        case 'streaming':
          result = await this.executeStreamingTool(tool, options)
          break
        default:
          result = { success: false, error: 'Invalid execution mode' }
      }

      // Track usage if successful and tracking is enabled
      if (result.success && options.trackUsage !== false) {
        await this.trackToolUsage(tool, options, result, startTime)
      }

      // Update quota
      await this.updateQuota(tool, options.userId, options.ipAddress)

      // Add quota information to result
      result.quotaRemaining = quotaCheck.remaining
      result.quotaLimit = quotaCheck.limit

      return result
    } catch (error) {
      const executionTime = Date.now() - startTime

      // Track failed usage
      if (options.trackUsage !== false) {
        await this.trackToolUsage(
          tool,
          options,
          { success: false, error: error.message },
          startTime
        )
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed',
        executionTime,
      }
    }
  }

  // Tool statistics and analytics
  async getToolStats(toolId: string): Promise<ToolStats> {
    try {
      // Get tool info
      const tool = await this.getToolById(toolId)
      if (!tool) {
        throw new Error(`Tool with ID ${toolId} not found`)
      }

      // Get usage statistics
      const usageResult = await this.client.queryFirst(TOOL_USAGE_QUERIES.COUNT_BY_TOOL, [toolId])
      const totalUsage = (usageResult?.count as number) || 0

      // Get success rate
      const successResult = await this.client.queryFirst(
        `
        SELECT COUNT(*) as count FROM tool_usage
        WHERE tool_id = ? AND status = 'success'
      `,
        [toolId]
      )
      const successCount = (successResult?.count as number) || 0

      const successRate = totalUsage > 0 ? (successCount / totalUsage) * 100 : 0

      // Get average execution time
      const timeResult = await this.client.queryFirst(
        `
        SELECT AVG(execution_time_ms) as avg_time FROM tool_usage
        WHERE tool_id = ? AND status = 'success' AND execution_time_ms IS NOT NULL
      `,
        [toolId]
      )
      const avgExecutionTime = Math.round(timeResult?.avg_time || 0)

      // Get last used time
      const lastUsedResult = await this.client.queryFirst(
        `
        SELECT MAX(created_at) as last_used FROM tool_usage
        WHERE tool_id = ? AND status = 'success'
      `,
        [toolId]
      )
      const lastUsed = lastUsedResult?.last_used ? parseInt(lastUsedResult.last_used, 10) : 0

      return {
        toolId,
        name: tool.name,
        category: tool.category,
        totalUsage,
        successRate,
        avgExecutionTime,
        lastUsed,
      }
    } catch (error) {
      throw new Error(`Failed to get tool stats: ${error}`)
    }
  }

  async getPopularTools(limit = 10): Promise<Array<{ tool: Tool; usageCount: number }>> {
    try {
      const stmt = this.db.prepare(`
        SELECT tool_id, COUNT(*) as usage_count
        FROM tool_usage
        WHERE created_at >= strftime('%s', 'now', '-7 days')
        GROUP BY tool_id
        ORDER BY usage_count DESC
        LIMIT ?
      `)
      const result = await stmt.bind(limit).all()

      const toolIds = result.results.map(row => row.tool_id)
      const tools = await Promise.all(toolIds.map(id => this.getToolById(id)))

      return result.results.map((row, index) => ({
        tool: tools[index]!,
        usageCount: row.usage_count as number,
      }))
    } catch (error) {
      throw new Error(`Failed to get popular tools: ${error}`)
    }
  }

  // Private helper methods
  private async executeSyncTool(
    tool: Tool,
    options: ToolExecutionOptions
  ): Promise<ToolExecutionResult> {
    // This is a placeholder - actual tool execution would be implemented
    // using WASM modules or external services

    const startTime = Date.now()

    try {
      // Simulate tool execution
      let output: any

      switch (tool.slug) {
        case 'json-format':
          output = this.formatJson(options.input)
          break
        case 'json-validate':
          output = this.validateJson(options.input)
          break
        case 'code-execute':
          output = this.executeCode(options.input)
          break
        default:
          throw new Error(`Tool ${tool.slug} not implemented`)
      }

      const executionTime = Date.now() - startTime

      return {
        success: true,
        output,
        executionTime,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed',
        executionTime: Date.now() - startTime,
      }
    }
  }

  private async executeAsyncTool(
    tool: Tool,
    options: ToolExecutionOptions
  ): Promise<ToolExecutionResult> {
    // Create a job for async execution
    const jobService = this.createJobService()

    const job = await jobService.createJob({
      tool_id: tool.id,
      user_id: options.userId,
      input_data: options.input,
    })

    return {
      success: true,
      jobId: job.id,
    }
  }

  private async executeStreamingTool(
    tool: Tool,
    options: ToolExecutionOptions
  ): Promise<ToolExecutionResult> {
    // Streaming tools would be implemented with server-sent events or WebSockets
    // For now, fall back to sync execution
    return this.executeSyncTool(tool, options)
  }

  // Mock tool implementations
  private formatJson(input: any): any {
    if (typeof input.json !== 'string') {
      throw new Error('JSON input must be a string')
    }

    try {
      const parsed = JSON.parse(input.json)
      const indent = input.indent || 2
      const sortKeys = input.sort_keys || false

      const formatted = JSON.stringify(
        parsed,
        sortKeys ? this.sortKeysAlphabetically : undefined,
        indent
      )

      return {
        formatted,
        valid: true,
        errors: null,
        size: formatted.length,
      }
    } catch (error) {
      return {
        formatted: null,
        valid: false,
        errors: [error instanceof Error ? error.message : 'Invalid JSON'],
        size: 0,
      }
    }
  }

  private validateJson(input: any): any {
    if (typeof input.json !== 'string') {
      throw new Error('JSON input must be a string')
    }

    try {
      const parsed = JSON.parse(input.json)

      if (input.schema) {
        // Basic schema validation (in production, use proper schema validator)
        const errors: string[] = []
        if (input.schema.type && typeof parsed !== input.schema.type) {
          errors.push(`Expected type ${input.schema.type}, got ${typeof parsed}`)
        }

        return {
          valid: errors.length === 0,
          errors: errors.length > 0 ? errors : null,
          data: parsed,
        }
      }

      return {
        valid: true,
        errors: null,
        data: parsed,
      }
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Invalid JSON'],
        data: null,
      }
    }
  }

  private executeCode(_input: any): any {
    // Code execution would be implemented with WASM sandbox
    // For now, return a mock response
    return {
      output: 'Code execution not yet implemented',
      error: null,
      exit_code: 0,
      execution_time: 100,
      memory_usage: 1024000,
    }
  }

  private sortKeysAlphabetically(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sortKeysAlphabetically(item))
    }

    const sorted: any = {}
    const keys = Object.keys(obj).sort()
    for (const key of keys) {
      sorted[key] = this.sortKeysAlphabetically(obj[key])
    }

    return sorted
  }

  private async checkQuota(
    tool: Tool,
    userId: string | undefined,
    ipAddress: string
  ): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    try {
      // Check tool-specific quotas
      const maxInputSize = tool.maxInputSize
      const inputSize = JSON.stringify(tool.config.inputSchema).length

      if (inputSize > maxInputSize) {
        return { allowed: false, remaining: 0, limit: maxInputSize }
      }

      // Check user/IP rate limits
      const quotaType = 'api_requests' // Could be more specific per tool
      const _quotaKey = userId || ipAddress

      const quotaStmt = this.db.prepare(QUOTA_COUNTER_QUERIES.SELECT_BY_USER_AND_TYPE)
      const result = await quotaStmt.bind(quotaType, Math.floor(Date.now() / 1000)).first()

      if (result) {
        const quota = QuotaCounter.fromRow(result)
        const remaining = Math.max(0, quota.limit_count - quota.used_count)

        return {
          allowed: remaining > 0,
          remaining,
          limit: quota.limit_count,
        }
      }

      // No quota found, allow with default limit
      return { allowed: true, remaining: 100, limit: 100 }
    } catch (error) {
      console.error('Failed to check quota:', error)
      // Fail open for quota checking
      return { allowed: true, remaining: 100, limit: 100 }
    }
  }

  private async updateQuota(
    _tool: Tool,
    userId: string | undefined,
    ipAddress: string
  ): Promise<void> {
    try {
      const quotaType = 'api_requests'
      const _quotaKey = userId || ipAddress
      const now = Math.floor(Date.now() / 1000)

      // Find existing quota counter
      let stmt = this.db.prepare(QUOTA_COUNTER_QUERIES.SELECT_BY_USER_AND_TYPE)
      const result = await stmt.bind(quotaType, now).first()

      if (result) {
        // Update existing counter
        stmt = this.db.prepare(QUOTA_COUNTER_QUERIES.UPDATE_USAGE)
        await stmt.bind(1, now, result.id).run()
      } else {
        // Create new counter
        const _period = QuotaCounter.createPeriod(quotaType, 'hour', now)
        const quota = QuotaCounter.createForAnonymous(ipAddress, quotaType, 'hour', 100, now)

        stmt = this.db.prepare(QUOTA_COUNTER_QUERIES.INSERT)
        await stmt
          .bind(
            quota.id,
            quota.user_id,
            quota.quota_type,
            quota.period_start,
            quota.period_end,
            quota.used_count,
            quota.limit_count,
            quota.ip_address,
            quota.created_at,
            quota.updated_at
          )
          .run()
      }
    } catch (error) {
      console.error('Failed to update quota:', error)
    }
  }

  private async trackToolUsage(
    tool: Tool,
    options: ToolExecutionOptions,
    result: ToolExecutionResult,
    startTime: number
  ): Promise<void> {
    try {
      const executionTime = result.executionTime || Date.now() - startTime
      const inputSize = JSON.stringify(options.input).length
      const outputSize = result.output ? JSON.stringify(result.output).length : 0

      const toolUsage = ToolUsage[result.success ? 'createSuccess' : 'createError'](
        tool.id,
        options.userId,
        inputSize,
        outputSize,
        executionTime,
        options.ipAddress,
        options.userAgent,
        result.success ? undefined : result.error
      )

      await this.client.execute(TOOL_USAGE_QUERIES.INSERT, [
        toolUsage.id,
        toolUsage.user_id,
        toolUsage.tool_id,
        toolUsage.input_size,
        toolUsage.output_size,
        toolUsage.execution_time_ms,
        toolUsage.status,
        toolUsage.error_message,
        toolUsage.ip_address,
        toolUsage.user_agent,
        toolUsage.created_at,
      ])

      // Log audit event
      if (this.auditEnabled) {
        await this.logAudit({
          action: 'tool_execute',
          resource_type: 'tool',
          resource_id: tool.id,
          new_values: {
            success: result.success,
            execution_time: executionTime,
            input_size: inputSize,
          },
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
        })
      }
    } catch (error) {
      console.error('Failed to track tool usage:', error)
    }
  }

  private createJobService(): any {
    // This would import and create a JobService instance
    // For now, return a mock
    return {
      createJob: async (jobData: any) => {
        return Job.create(jobData)
      },
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
        user_id: undefined, // Tool usage may be anonymous
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

  private isCacheExpired(toolId: string): boolean {
    const expiry = this.cacheExpiry.get(toolId)
    return !expiry || Date.now() > expiry
  }

  // Cache management
  clearCache(): void {
    this.toolCache.clear()
    this.cacheExpiry.clear()
  }

  async warmupCache(): Promise<void> {
    try {
      const tools = await this.getTools()
      for (const tool of tools) {
        this.toolCache.set(tool.id, tool)
        this.cacheExpiry.set(tool.id, Date.now() + 5 * 60 * 1000)
      }
    } catch (error) {
      console.error('Failed to warmup cache:', error)
    }
  }

  // Advanced cache management
  async invalidateToolCache(toolId?: string): Promise<void> {
    if (!this.cacheService || !this.enableAdvancedCaching) {
      return
    }

    try {
      if (toolId) {
        // Invalidate specific tool cache
        await this.cacheService.invalidate({
          namespace: 'cache',
          tags: [`tool_id:${toolId}`, 'tool'],
        })

        // Clear local cache
        this.toolCache.delete(toolId)
        this.cacheExpiry.delete(toolId)
      } else {
        // Invalidate all tool-related cache
        await this.cacheService.invalidate({
          namespace: 'cache',
          tags: ['tool', 'tools_list'],
        })

        // Clear local cache
        this.toolCache.clear()
        this.cacheExpiry.clear()
      }
    } catch (error) {
      console.error('Failed to invalidate tool cache:', error)
    }
  }

  async warmupAdvancedCache(): Promise<void> {
    if (!this.cacheService || !this.enableAdvancedCaching) {
      return
    }

    try {
      // Warmup tools list
      await this.cacheService.warmup('cache', [
        {
          key: 'tools:all:enabled',
          fetchFn: () => this.fetchToolsFromDatabase(undefined, true),
          ttl: 900,
          tags: ['tools_list', 'category:all'],
          priority: 1,
        },
        {
          key: 'tools:all:all',
          fetchFn: () => this.fetchToolsFromDatabase(undefined, false),
          ttl: 900,
          tags: ['tools_list', 'category:all'],
          priority: 2,
        },
      ])

      // Warmup popular tools by category
      const categories = ['json', 'code', 'file', 'data']
      for (const category of categories) {
        await this.cacheService.warmup('cache', [
          {
            key: `tools:${category}:enabled`,
            fetchFn: () => this.fetchToolsFromDatabase(category, true),
            ttl: 900,
            tags: ['tools_list', `category:${category}`],
            priority: 1,
          },
        ])
      }

      // Warmup individual tools
      const tools = await this.fetchToolsFromDatabase(undefined, true)
      for (const tool of tools.slice(0, 10)) {
        // Top 10 tools
        await this.cacheService.warmup('cache', [
          {
            key: `tool:${tool.id}`,
            fetchFn: () => Promise.resolve(tool),
            ttl: 1800,
            tags: ['tool', `tool_id:${tool.id}`],
            priority: 1,
          },
          {
            key: `tool_by_slug:${tool.slug}`,
            fetchFn: () => Promise.resolve(tool),
            ttl: 1800,
            tags: ['tool', 'slug_lookup'],
            priority: 2,
          },
        ])
      }
    } catch (error) {
      console.error('Failed to warmup advanced cache:', error)
    }
  }

  async getToolCacheAnalytics() {
    if (!this.cacheService) {
      return null
    }
    return this.cacheService.getAnalytics()
  }

  getToolCacheMetrics() {
    if (!this.cacheService) {
      return null
    }
    return this.cacheService.getMetrics()
  }
}
