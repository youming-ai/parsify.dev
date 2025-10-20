import { z } from 'zod'

// Tool usage status
export const ToolUsageStatusSchema = z.enum(['success', 'error', 'timeout'])
export type ToolUsageStatus = z.infer<typeof ToolUsageStatusSchema>

// Tool usage schema for validation
export const ToolUsageSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  tool_id: z.string().uuid(),
  input_size: z.number().default(0),
  output_size: z.number().default(0),
  execution_time_ms: z.number().nullable(),
  status: ToolUsageStatusSchema,
  error_message: z.string().nullable(),
  ip_address: z.string().ip().nullable(),
  user_agent: z.string().nullable(),
  created_at: z.number()
})

export type ToolUsage = z.infer<typeof ToolUsageSchema>

// Tool usage creation schema
export const CreateToolUsageSchema = ToolUsageSchema.partial({
  id: true,
  created_at: true,
  input_size: true,
  output_size: true
})

export type CreateToolUsage = z.infer<typeof CreateToolUsageSchema>

// Analytics aggregation schema
export const ToolUsageAnalyticsSchema = z.object({
  tool_id: z.string().uuid(),
  date: z.string(), // YYYY-MM-DD format
  total_requests: z.number(),
  successful_requests: z.number(),
  failed_requests: z.number(),
  avg_execution_time_ms: z.number(),
  total_input_size_bytes: z.number(),
  total_output_size_bytes: z.number(),
  unique_users: z.number(),
  anonymous_requests: z.number()
})

export type ToolUsageAnalytics = z.infer<typeof ToolUsageAnalyticsSchema>

// Tool usage model class
export class ToolUsage {
  public id: string
  public user_id: string | null
  public tool_id: string
  public input_size: number
  public output_size: number
  public execution_time_ms: number | null
  public status: ToolUsageStatus
  public error_message: string | null
  public ip_address: string | null
  public user_agent: string | null
  public created_at: number

  constructor(data: ToolUsage) {
    this.id = data.id
    this.user_id = data.user_id
    this.tool_id = data.tool_id
    this.input_size = data.input_size
    this.output_size = data.output_size
    this.execution_time_ms = data.execution_time_ms
    this.status = data.status
    this.error_message = data.error_message
    this.ip_address = data.ip_address
    this.user_agent = data.user_agent
    this.created_at = data.created_at
  }

  // Static methods for database operations
  static create(data: CreateToolUsage): ToolUsage {
    return new ToolUsage({
      id: crypto.randomUUID(),
      created_at: Math.floor(Date.now() / 1000),
      input_size: 0,
      output_size: 0,
      ...data
    })
  }

  static fromRow(row: any): ToolUsage {
    return new ToolUsage(ToolUsageSchema.parse(row))
  }

  toRow(): Record<string, any> {
    return {
      id: this.id,
      user_id: this.user_id,
      tool_id: this.tool_id,
      input_size: this.input_size,
      output_size: this.output_size,
      execution_time_ms: this.execution_time_ms,
      status: this.status,
      error_message: this.error_message,
      ip_address: this.ip_address,
      user_agent: this.user_agent,
      created_at: this.created_at
    }
  }

  // Factory methods for different usage scenarios
  static createSuccess(
    toolId: string,
    userId: string | null,
    inputSize: number,
    outputSize: number,
    executionTimeMs: number,
    ipAddress?: string,
    userAgent?: string
  ): ToolUsage {
    return ToolUsage.create({
      user_id: userId,
      tool_id: toolId,
      input_size: inputSize,
      output_size: outputSize,
      execution_time_ms: executionTimeMs,
      status: 'success',
      error_message: null,
      ip_address: ipAddress || null,
      user_agent: userAgent || null
    })
  }

  static createError(
    toolId: string,
    userId: string | null,
    errorMessage: string,
    inputSize: number = 0,
    executionTimeMs: number | null = null,
    ipAddress?: string,
    userAgent?: string
  ): ToolUsage {
    return ToolUsage.create({
      user_id: userId,
      tool_id: toolId,
      input_size: inputSize,
      output_size: 0,
      execution_time_ms: executionTimeMs,
      status: 'error',
      error_message: errorMessage,
      ip_address: ipAddress || null,
      user_agent: userAgent || null
    })
  }

  static createTimeout(
    toolId: string,
    userId: string | null,
    inputSize: number = 0,
    executionTimeMs: number | null = null,
    ipAddress?: string,
    userAgent?: string
  ): ToolUsage {
    return ToolUsage.create({
      user_id: userId,
      tool_id: toolId,
      input_size: inputSize,
      output_size: 0,
      execution_time_ms: executionTimeMs,
      status: 'timeout',
      error_message: 'Execution timeout',
      ip_address: ipAddress || null,
      user_agent: userAgent || null
    })
  }

  // Helper methods
  get isSuccessful(): boolean {
    return this.status === 'success'
  }

  get isFailed(): boolean {
    return this.status === 'error' || this.status === 'timeout'
  }

  get isAnonymous(): boolean {
    return this.user_id === null
  }

  get dataTransferRatio(): number {
    if (this.input_size === 0) return 0
    return this.output_size / this.input_size
  }

  get executionTimeString(): string {
    if (!this.execution_time_ms) return 'N/A'
    if (this.execution_time_ms < 1000) {
      return `${this.execution_time_ms}ms`
    }
    return `${(this.execution_time_ms / 1000).toFixed(2)}s`
  }

  get sizeString(): string {
    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const input = formatBytes(this.input_size)
    const output = formatBytes(this.output_size)
    return `${input} → ${output}`
  }

  // Analytics calculations
  static calculateAnalytics(usages: ToolUsage[]): ToolUsageAnalytics[] {
    const groupedByToolAndDate = new Map<string, ToolUsage[]>()

    // Group usages by tool_id and date
    for (const usage of usages) {
      const date = new Date(usage.created_at * 1000).toISOString().split('T')[0]
      const key = `${usage.tool_id}-${date}`

      if (!groupedByToolAndDate.has(key)) {
        groupedByToolAndDate.set(key, [])
      }
      groupedByToolAndDate.get(key)!.push(usage)
    }

    // Calculate analytics for each group
    const analytics: ToolUsageAnalytics[] = []
    for (const [key, toolUsages] of groupedByToolAndDate) {
      const [toolId, date] = key.split('-')
      const successful = toolUsages.filter(u => u.status === 'success')
      const failed = toolUsages.filter(u => u.status === 'error' || u.status === 'timeout')
      const uniqueUsers = new Set(toolUsages.filter(u => u.user_id).map(u => u.user_id)).size
      const anonymousCount = toolUsages.filter(u => !u.user_id).length

      const avgExecutionTime = successful.length > 0
        ? successful.reduce((sum, u) => sum + (u.execution_time_ms || 0), 0) / successful.length
        : 0

      analytics.push({
        tool_id: toolId,
        date,
        total_requests: toolUsages.length,
        successful_requests: successful.length,
        failed_requests: failed.length,
        avg_execution_time_ms: Math.round(avgExecutionTime),
        total_input_size_bytes: toolUsages.reduce((sum, u) => sum + u.input_size, 0),
        total_output_size_bytes: toolUsages.reduce((sum, u) => sum + u.output_size, 0),
        unique_users: uniqueUsers,
        anonymous_requests: anonymousCount
      })
    }

    return analytics
  }

  // Performance metrics
  static getPerformanceMetrics(usages: ToolUsage[]): {
    total_requests: number;
    success_rate: number;
    avg_execution_time_ms: number;
    p95_execution_time_ms: number;
    total_data_processed_bytes: number;
    most_used_tool_id: string | null;
  } {
    if (usages.length === 0) {
      return {
        total_requests: 0,
        success_rate: 0,
        avg_execution_time_ms: 0,
        p95_execution_time_ms: 0,
        total_data_processed_bytes: 0,
        most_used_tool_id: null
      }
    }

    const successful = usages.filter(u => u.status === 'success')
    const successRate = (successful.length / usages.length) * 100

    const executionTimes = successful
      .map(u => u.execution_time_ms)
      .filter((time): time is number => time !== null)
      .sort((a, b) => a - b)

    const avgExecutionTime = executionTimes.length > 0
      ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
      : 0

    const p95Index = Math.floor(executionTimes.length * 0.95)
    const p95ExecutionTime = executionTimes.length > 0 ? executionTimes[p95Index] || 0 : 0

    const totalDataProcessed = usages.reduce((sum, u) => sum + u.input_size + u.output_size, 0)

    // Find most used tool
    const toolCounts = new Map<string, number>()
    for (const usage of usages) {
      toolCounts.set(usage.tool_id, (toolCounts.get(usage.tool_id) || 0) + 1)
    }

    let mostUsedToolId: string | null = null
    let maxCount = 0
    for (const [toolId, count] of toolCounts) {
      if (count > maxCount) {
        maxCount = count
        mostUsedToolId = toolId
      }
    }

    return {
      total_requests: usages.length,
      success_rate: Math.round(successRate * 100) / 100,
      avg_execution_time_ms: Math.round(avgExecutionTime),
      p95_execution_time_ms: p95ExecutionTime,
      total_data_processed_bytes: totalDataProcessed,
      most_used_tool_id: mostUsedToolId
    }
  }
}

// SQL queries
export const TOOL_USAGE_QUERIES = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS tool_usage (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      tool_id TEXT NOT NULL,
      input_size INTEGER DEFAULT 0,
      output_size INTEGER DEFAULT 0,
      execution_time_ms INTEGER,
      status TEXT NOT NULL,
      error_message TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (tool_id) REFERENCES tools(id)
    );
  `,

  CREATE_INDEXES: [
    'CREATE INDEX IF NOT EXISTS idx_tool_usage_user_id ON tool_usage(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_tool_usage_tool_id ON tool_usage(tool_id);',
    'CREATE INDEX IF NOT EXISTS idx_tool_usage_created_at ON tool_usage(created_at);',
    'CREATE INDEX IF NOT EXISTS idx_tool_usage_status ON tool_usage(status);',
    'CREATE INDEX IF NOT EXISTS idx_tool_usage_user_date ON tool_usage(user_id, created_at);'
  ],

  INSERT: `
    INSERT INTO tool_usage (id, user_id, tool_id, input_size, output_size, execution_time_ms, status, error_message, ip_address, user_agent, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `,

  SELECT_BY_ID: `
    SELECT * FROM tool_usage WHERE id = ?;
  `,

  SELECT_BY_USER: `
    SELECT * FROM tool_usage WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?;
  `,

  SELECT_BY_TOOL: `
    SELECT * FROM tool_usage WHERE tool_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?;
  `,

  SELECT_BY_USER_AND_TOOL: `
    SELECT * FROM tool_usage WHERE user_id = ? AND tool_id = ? ORDER BY created_at DESC LIMIT ?;
  `,

  SELECT_BY_DATE_RANGE: `
    SELECT * FROM tool_usage
    WHERE created_at >= ? AND created_at <= ?
    ORDER BY created_at DESC;
  `,

  SELECT_RECENT: `
    SELECT * FROM tool_usage ORDER BY created_at DESC LIMIT ?;
  `,

  COUNT: `
    SELECT COUNT(*) as count FROM tool_usage;
  `,

  COUNT_BY_USER: `
    SELECT COUNT(*) as count FROM tool_usage WHERE user_id = ?;
  `,

  COUNT_BY_TOOL: `
    SELECT COUNT(*) as count FROM tool_usage WHERE tool_id = ?;
  `,

  COUNT_BY_STATUS: `
    SELECT COUNT(*) as count FROM tool_usage WHERE status = ?;
  `,

  COUNT_BY_DATE_RANGE: `
    SELECT COUNT(*) as count FROM tool_usage WHERE created_at >= ? AND created_at <= ?;
  `,

  // Analytics queries
  ANALYTICS_DAILY_BY_TOOL: `
    SELECT
      tool_id,
      DATE(created_at, 'unixepoch') as date,
      COUNT(*) as total_requests,
      COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_requests,
      COUNT(CASE WHEN status IN ('error', 'timeout') THEN 1 END) as failed_requests,
      AVG(CASE WHEN status = 'success' THEN execution_time_ms END) as avg_execution_time_ms,
      SUM(input_size) as total_input_size_bytes,
      SUM(output_size) as total_output_size_bytes,
      COUNT(DISTINCT user_id) as unique_users,
      COUNT(CASE WHEN user_id IS NULL THEN 1 END) as anonymous_requests
    FROM tool_usage
    WHERE created_at >= ?
    GROUP BY tool_id, DATE(created_at, 'unixepoch')
    ORDER BY date DESC, total_requests DESC;
  `,

  CLEANUP_OLD: `
    DELETE FROM tool_usage WHERE created_at < ?;
  `
} as const