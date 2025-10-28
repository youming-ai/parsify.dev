import { z } from 'zod'

// Audit actions
export const AuditActionSchema = z.enum([
  'login',
  'logout',
  'register',
  'tool_execute',
  'file_upload',
  'file_download',
  'job_create',
  'job_complete',
  'job_fail',
  'quota_exceeded',
  'auth_failure',
  'permission_denied',
  'admin_action',
  'data_export',
  'data_delete',
  'config_change',
  'api_access',
  'rate_limit_hit',
  'security_event',
  'error_occurred',
])
export type AuditAction = z.infer<typeof AuditActionSchema>

// Resource types
export const ResourceTypeSchema = z.enum([
  'user',
  'auth_identity',
  'tool',
  'tool_usage',
  'job',
  'file_upload',
  'quota_counter',
  'session',
  'api_key',
  'system_config',
  'admin_log',
])
export type ResourceType = z.infer<typeof ResourceTypeSchema>

// Audit log schema for validation
export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  action: AuditActionSchema,
  resource_type: ResourceTypeSchema,
  resource_id: z.string().nullable(),
  old_values: z.record(z.any()).nullable(),
  new_values: z.record(z.any()).nullable(),
  ip_address: z.string().ip().nullable(),
  user_agent: z.string().nullable(),
  success: z.boolean().default(true),
  error_message: z.string().nullable(),
  created_at: z.number(),
})

export type AuditLog = z.infer<typeof AuditLogSchema>

// Audit log creation schema
export const CreateAuditLogSchema = AuditLogSchema.partial({
  id: true,
  success: true,
  created_at: true,
})

export type CreateAuditLog = z.infer<typeof CreateAuditLogSchema>

// Audit log update schema
export const UpdateAuditLogSchema = AuditLogSchema.partial({
  id: true,
  user_id: true,
  action: true,
  resource_type: true,
  resource_id: true,
  old_values: true,
  new_values: true,
  ip_address: true,
  user_agent: true,
  created_at: true,
})

export type UpdateAuditLog = z.infer<typeof UpdateAuditLogSchema>

// Audit event context
export const AuditContextSchema = z.object({
  request_id: z.string().optional(),
  session_id: z.string().optional(),
  correlation_id: z.string().optional(),
  source_ip: z.string().ip().optional(),
  device_info: z.record(z.any()).optional(),
  geo_location: z
    .object({
      country: z.string().optional(),
      region: z.string().optional(),
      city: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),
})

export type AuditContext = z.infer<typeof AuditContextSchema>

// Audit filter options
export const AuditFilterSchema = z.object({
  user_id: z.string().uuid().optional(),
  action: AuditActionSchema.optional(),
  resource_type: ResourceTypeSchema.optional(),
  resource_id: z.string().optional(),
  success: z.boolean().optional(),
  ip_address: z.string().ip().optional(),
  date_from: z.number().optional(),
  date_to: z.number().optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
})

export type AuditFilter = z.infer<typeof AuditFilterSchema>

// Audit log model class
export class AuditLog {
  public id: string
  public user_id: string | null
  public action: AuditAction
  public resource_type: ResourceType
  public resource_id: string | null
  public old_values: Record<string, any> | null
  public new_values: Record<string, any> | null
  public ip_address: string | null
  public user_agent: string | null
  public success: boolean
  public error_message: string | null
  public created_at: number

  constructor(data: AuditLog) {
    this.id = data.id
    this.user_id = data.user_id
    this.action = data.action
    this.resource_type = data.resource_type
    this.resource_id = data.resource_id
    this.old_values = data.old_values
    this.new_values = data.new_values
    this.ip_address = data.ip_address
    this.user_agent = data.user_agent
    this.success = data.success
    this.error_message = data.error_message
    this.created_at = data.created_at
  }

  // Static methods for database operations
  static create(data: CreateAuditLog): AuditLog {
    return new AuditLog({
      id: crypto.randomUUID(),
      success: true,
      created_at: Math.floor(Date.now() / 1000),
      ...data,
    })
  }

  static fromRow(row: any): AuditLog {
    return new AuditLog(
      AuditLogSchema.parse({
        ...row,
        old_values: row.old_values ? JSON.parse(row.old_values) : null,
        new_values: row.new_values ? JSON.parse(row.new_values) : null,
      })
    )
  }

  toRow(): Record<string, any> {
    return {
      id: this.id,
      user_id: this.user_id,
      action: this.action,
      resource_type: this.resource_type,
      resource_id: this.resource_id,
      old_values: this.old_values ? JSON.stringify(this.old_values) : null,
      new_values: this.new_values ? JSON.stringify(this.new_values) : null,
      ip_address: this.ip_address,
      user_agent: this.user_agent,
      success: this.success,
      error_message: this.error_message,
      created_at: this.created_at,
    }
  }

  // Helper methods
  get isSuccessful(): boolean {
    return this.success
  }

  get isFailed(): boolean {
    return !this.success
  }

  get isAnonymous(): boolean {
    return this.user_id === null
  }

  get isSecurityEvent(): boolean {
    const securityActions = [
      'auth_failure',
      'permission_denied',
      'quota_exceeded',
      'rate_limit_hit',
      'security_event',
    ]
    return securityActions.includes(this.action)
  }

  get isDataAccess(): boolean {
    const dataAccessActions = ['file_upload', 'file_download', 'data_export', 'data_delete']
    return dataAccessActions.includes(this.action)
  }

  get isAdministrative(): boolean {
    const adminActions = ['admin_action', 'config_change']
    return adminActions.includes(this.action)
  }

  get actionDescription(): string {
    const descriptions: Record<AuditAction, string> = {
      login: 'User login attempt',
      logout: 'User logout',
      register: 'User registration',
      tool_execute: 'Tool execution',
      file_upload: 'File upload',
      file_download: 'File download',
      job_create: 'Job creation',
      job_complete: 'Job completion',
      job_fail: 'Job failure',
      quota_exceeded: 'Quota limit exceeded',
      auth_failure: 'Authentication failure',
      permission_denied: 'Permission denied',
      admin_action: 'Administrative action',
      data_export: 'Data export',
      data_delete: 'Data deletion',
      config_change: 'Configuration change',
      api_access: 'API access',
      rate_limit_hit: 'Rate limit exceeded',
      security_event: 'Security event',
      error_occurred: 'Error occurred',
    }
    return descriptions[this.action] || this.action
  }

  get resourceDescription(): string {
    if (!this.resource_id) return this.resource_type
    return `${this.resource_type}:${this.resource_id}`
  }

  get timestampString(): string {
    return new Date(this.created_at * 1000).toISOString()
  }

  get changeSummary(): string | null {
    if (!this.old_values && !this.new_values) return null

    const oldKeys = this.old_values ? Object.keys(this.old_values) : []
    const newKeys = this.new_values ? Object.keys(this.new_values) : []
    const allKeys = [...new Set([...oldKeys, ...newKeys])]

    if (allKeys.length === 0) return null

    const changes = allKeys
      .map(key => {
        const oldValue = this.old_values?.[key]
        const newValue = this.new_values?.[key]

        if (oldValue === undefined) {
          return `${key}: → ${JSON.stringify(newValue)}`
        } else if (newValue === undefined) {
          return `${key}: ${JSON.stringify(oldValue)} →`
        } else if (oldValue !== newValue) {
          return `${key}: ${JSON.stringify(oldValue)} → ${JSON.stringify(newValue)}`
        }

        return null
      })
      .filter(Boolean) as string[]

    return changes.length > 0 ? changes.join(', ') : null
  }

  // Factory methods
  static login(userId: string, ipAddress?: string, userAgent?: string, success = true): AuditLog {
    return AuditLog.create({
      user_id: userId,
      action: 'login',
      resource_type: 'user',
      resource_id: userId,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      success,
      error_message: success ? null : 'Login failed',
    })
  }

  static toolExecute(
    userId: string | null,
    toolId: string,
    inputData: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    success = true,
    errorMessage?: string
  ): AuditLog {
    return AuditLog.create({
      user_id: userId,
      action: 'tool_execute',
      resource_type: 'tool',
      resource_id: toolId,
      new_values: { input_size: JSON.stringify(inputData).length },
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      success,
      error_message: errorMessage || null,
    })
  }

  static fileUpload(
    userId: string | null,
    fileId: string,
    filename: string,
    fileSize: number,
    ipAddress?: string,
    userAgent?: string,
    success = true,
    errorMessage?: string
  ): AuditLog {
    return AuditLog.create({
      user_id: userId,
      action: 'file_upload',
      resource_type: 'file_upload',
      resource_id: fileId,
      new_values: { filename, file_size: fileSize },
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      success,
      error_message: errorMessage || null,
    })
  }

  static authFailure(
    identifier: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): AuditLog {
    return AuditLog.create({
      user_id: null,
      action: 'auth_failure',
      resource_type: 'user',
      resource_id: null,
      new_values: { identifier, reason },
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      success: false,
      error_message: reason,
    })
  }

  static quotaExceeded(
    userId: string | null,
    quotaType: string,
    ipAddress?: string,
    userAgent?: string
  ): AuditLog {
    return AuditLog.create({
      user_id: userId,
      action: 'quota_exceeded',
      resource_type: 'quota_counter',
      resource_id: null,
      new_values: { quota_type: quotaType },
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      success: false,
      error_message: `Quota exceeded for ${quotaType}`,
    })
  }

  static securityEvent(
    event: string,
    details: Record<string, any>,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): AuditLog {
    return AuditLog.create({
      user_id: userId || null,
      action: 'security_event',
      resource_type: 'system_config',
      resource_id: null,
      new_values: { event, ...details },
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      success: true,
    })
  }

  static dataChange(
    userId: string,
    resourceType: ResourceType,
    resourceId: string,
    _oldValues: Record<string, any> | null,
    _newValues: Record<string, any> | null,
    ipAddress?: string,
    userAgent?: string
  ): AuditLog {
    return AuditLog.create({
      user_id: userId,
      action: 'admin_action',
      resource_type: resourceType,
      resource_id: resourceId,
      old_values,
      new_values,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      success: true,
    })
  }

  // Analytics methods
  static getSecurityEvents(logs: AuditLog[]): AuditLog[] {
    return logs.filter(log => log.isSecurityEvent)
  }

  static getFailedLogins(logs: AuditLog[]): AuditLog[] {
    return logs.filter(log => log.action === 'login' && log.isFailed)
  }

  static getDataAccessLogs(logs: AuditLog[]): AuditLog[] {
    return logs.filter(log => log.isDataAccess)
  }

  static getAdminActions(logs: AuditLog[]): AuditLog[] {
    return logs.filter(log => log.isAdministrative)
  }

  static getActionStats(
    logs: AuditLog[]
  ): Record<AuditAction, { count: number; success_rate: number }> {
    const stats: Record<AuditAction, { count: number; success_rate: number }> = {} as any

    for (const action of Object.values(AuditActionSchema.enum)) {
      const actionLogs = logs.filter(log => log.action === action)
      const successCount = actionLogs.filter(log => log.success).length

      stats[action] = {
        count: actionLogs.length,
        success_rate: actionLogs.length > 0 ? (successCount / actionLogs.length) * 100 : 0,
      }
    }

    return stats
  }

  static getUserActivitySummary(logs: AuditLog[]): Array<{
    user_id: string
    total_actions: number
    successful_actions: number
    failed_actions: number
    unique_actions: Set<AuditAction>
    last_activity: number
  }> {
    const userMap = new Map<string, any>()

    for (const log of logs) {
      if (!log.user_id) continue

      if (!userMap.has(log.user_id)) {
        userMap.set(log.user_id, {
          user_id: log.user_id,
          total_actions: 0,
          successful_actions: 0,
          failed_actions: 0,
          unique_actions: new Set(),
          last_activity: 0,
        })
      }

      const userStats = userMap.get(log.user_id)
      userStats.total_actions++

      if (log.success) {
        userStats.successful_actions++
      } else {
        userStats.failed_actions++
      }

      userStats.unique_actions.add(log.action)
      userStats.last_activity = Math.max(userStats.last_activity, log.created_at)
    }

    return Array.from(userMap.values())
  }
}

// SQL queries
export const AUDIT_LOG_QUERIES = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      old_values TEXT,
      new_values TEXT,
      ip_address TEXT,
      user_agent TEXT,
      success BOOLEAN DEFAULT true,
      error_message TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `,

  CREATE_INDEXES: [
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);',
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);',
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);',
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);',
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);',
  ],

  INSERT: `
    INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent, success, error_message, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `,

  SELECT_BY_ID: `
    SELECT * FROM audit_logs WHERE id = ?;
  `,

  SELECT_BY_USER: `
    SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?;
  `,

  SELECT_BY_ACTION: `
    SELECT * FROM audit_logs WHERE action = ? ORDER BY created_at DESC LIMIT ? OFFSET ?;
  `,

  SELECT_BY_RESOURCE: `
    SELECT * FROM audit_logs WHERE resource_type = ? AND resource_id = ? ORDER BY created_at DESC LIMIT ?;
  `,

  SELECT_BY_DATE_RANGE: `
    SELECT * FROM audit_logs
    WHERE created_at >= ? AND created_at <= ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?;
  `,

  SELECT_BY_IP: `
    SELECT * FROM audit_logs WHERE ip_address = ? ORDER BY created_at DESC LIMIT ? OFFSET ?;
  `,

  SELECT_FAILED: `
    SELECT * FROM audit_logs WHERE success = false ORDER BY created_at DESC LIMIT ? OFFSET ?;
  `,

  SELECT_SECURITY_EVENTS: `
    SELECT * FROM audit_logs
    WHERE action IN ('auth_failure', 'permission_denied', 'quota_exceeded', 'rate_limit_hit', 'security_event')
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?;
  `,

  SELECT_USER_ACTIVITY: `
    SELECT
      user_id,
      COUNT(*) as total_actions,
      COUNT(CASE WHEN success = true THEN 1 END) as successful_actions,
      COUNT(CASE WHEN success = false THEN 1 END) as failed_actions,
      MAX(created_at) as last_activity
    FROM audit_logs
    WHERE user_id IS NOT NULL
    GROUP BY user_id
    ORDER BY last_activity DESC
    LIMIT ? OFFSET ?;
  `,

  COUNT: `
    SELECT COUNT(*) as count FROM audit_logs;
  `,

  COUNT_BY_USER: `
    SELECT COUNT(*) as count FROM audit_logs WHERE user_id = ?;
  `,

  COUNT_BY_ACTION: `
    SELECT COUNT(*) as count FROM audit_logs WHERE action = ?;
  `,

  COUNT_BY_DATE_RANGE: `
    SELECT COUNT(*) as count FROM audit_logs WHERE created_at >= ? AND created_at <= ?;
  `,

  COUNT_FAILED: `
    SELECT COUNT(*) as count FROM audit_logs WHERE success = false;
  `,

  // Cleanup queries
  DELETE_OLD_LOGS: `
    DELETE FROM audit_logs WHERE created_at < ?;
  `,

  // Analytics queries
  ACTION_ANALYTICS: `
    SELECT
      action,
      COUNT(*) as total_count,
      COUNT(CASE WHEN success = true THEN 1 END) as success_count,
      COUNT(CASE WHEN success = false THEN 1 END) as failure_count,
      COUNT(CASE WHEN user_id IS NULL THEN 1 END) as anonymous_count,
      DATE(created_at, 'unixepoch') as event_date
    FROM audit_logs
    WHERE created_at >= ?
    GROUP BY action, DATE(created_at, 'unixepoch')
    ORDER BY event_date DESC, total_count DESC;
  `,

  USER_ACTIVITY_ANALYTICS: `
    SELECT
      user_id,
      action,
      COUNT(*) as action_count,
      DATE(created_at, 'unixepoch') as activity_date
    FROM audit_logs
    WHERE user_id IS NOT NULL AND created_at >= ?
    GROUP BY user_id, action, DATE(created_at, 'unixepoch')
    ORDER BY activity_date DESC, action_count DESC;
  `,

  SECURITY_ANALYTICS: `
    SELECT
      action,
      ip_address,
      COUNT(*) as event_count,
      COUNT(DISTINCT user_id) as unique_users,
      DATE(created_at, 'unixepoch') as event_date
    FROM audit_logs
    WHERE action IN ('auth_failure', 'permission_denied', 'quota_exceeded', 'rate_limit_hit', 'security_event')
      AND created_at >= ?
    GROUP BY action, ip_address, DATE(created_at, 'unixepoch')
    ORDER BY event_date DESC, event_count DESC;
  `,
} as const
