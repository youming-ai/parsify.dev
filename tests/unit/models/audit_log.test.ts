import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  AUDIT_LOG_QUERIES,
  AuditContextSchema,
  AuditFilterSchema,
  AuditLog,
  AuditLogSchema,
  CreateAuditLogSchema,
} from '../../../../apps/api/src/models/audit_log'
import {
  cleanupTestEnvironment,
  createMockAuditLog,
  createTestDatabase,
  setupTestEnvironment,
} from './database.mock'

describe('AuditLog Model', () => {
  let mockDb: any

  beforeEach(() => {
    setupTestEnvironment()
    mockDb = createTestDatabase()
  })

  afterEach(() => {
    cleanupTestEnvironment()
  })

  describe('Schema Validation', () => {
    it('should validate a complete audit log object', () => {
      const auditData = createMockAuditLog()
      const result = AuditLogSchema.safeParse(auditData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe(auditData.id)
        expect(result.data.user_id).toBe(auditData.user_id)
        expect(result.data.action).toBe(auditData.action)
      }
    })

    it('should reject invalid action', () => {
      const invalidAudit = createMockAuditLog({ action: 'invalid' as any })
      const result = AuditLogSchema.safeParse(invalidAudit)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('action')
      }
    })

    it('should reject invalid resource type', () => {
      const invalidAudit = createMockAuditLog({
        resource_type: 'invalid' as any,
      })
      const result = AuditLogSchema.safeParse(invalidAudit)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('resource_type')
      }
    })

    it('should accept valid actions', () => {
      const validActions = [
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
      ]

      validActions.forEach(action => {
        const audit = createMockAuditLog({ action: action as any })
        const result = AuditLogSchema.safeParse(audit)
        expect(result.success).toBe(true)
      })
    })

    it('should accept valid resource types', () => {
      const validTypes = [
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
      ]

      validTypes.forEach(type => {
        const audit = createMockAuditLog({ resource_type: type as any })
        const result = AuditLogSchema.safeParse(audit)
        expect(result.success).toBe(true)
      })
    })

    it('should validate audit log creation schema', () => {
      const createData = {
        user_id: 'user-123',
        action: 'login' as const,
        resource_type: 'user' as const,
        resource_id: 'user-123',
        ip_address: '127.0.0.1',
        user_agent: 'test-agent',
      }

      const result = CreateAuditLogSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })

    it('should validate audit context schema', () => {
      const context = {
        request_id: 'req-123',
        session_id: 'sess-123',
        correlation_id: 'corr-123',
        source_ip: '192.168.1.1',
        device_info: { platform: 'web', browser: 'chrome' },
        geo_location: {
          country: 'US',
          region: 'CA',
          city: 'San Francisco',
          latitude: 37.7749,
          longitude: -122.4194,
        },
      }

      const result = AuditContextSchema.safeParse(context)
      expect(result.success).toBe(true)
    })

    it('should validate audit filter schema', () => {
      const filter = {
        user_id: 'user-123',
        action: 'login' as const,
        resource_type: 'user' as const,
        success: true,
        date_from: Math.floor(Date.now() / 1000) - 86400,
        date_to: Math.floor(Date.now() / 1000),
        limit: 50,
        offset: 0,
      }

      const result = AuditFilterSchema.safeParse(filter)
      expect(result.success).toBe(true)
    })
  })

  describe('Model Creation and Instantiation', () => {
    it('should create an audit log instance with valid data', () => {
      const auditData = createMockAuditLog()
      const audit = new AuditLog(auditData)

      expect(audit.id).toBe(auditData.id)
      expect(audit.user_id).toBe(auditData.user_id)
      expect(audit.action).toBe(auditData.action)
      expect(audit.resource_type).toBe(auditData.resource_type)
      expect(audit.success).toBe(auditData.success)
    })

    it('should create an audit log with static create method', () => {
      const createData = {
        user_id: 'user-456',
        action: 'logout' as const,
        resource_type: 'user' as const,
        resource_id: 'user-456',
        ip_address: '192.168.1.1',
      }

      const audit = AuditLog.create(createData)

      expect(audit.id).toBeDefined()
      expect(audit.user_id).toBe(createData.user_id)
      expect(audit.action).toBe(createData.action)
      expect(audit.success).toBe(true)
      expect(audit.created_at).toBeDefined()
    })

    it('should create audit log from database row', () => {
      const rowData = createMockAuditLog()
      mockDb.setTableData('audit_logs', [rowData])

      const audit = AuditLog.fromRow(rowData)

      expect(audit).toBeInstanceOf(AuditLog)
      expect(audit.id).toBe(rowData.id)
      expect(audit.action).toBe(rowData.action)
    })

    it('should parse JSON old_values and new_values in fromRow', () => {
      const oldValues = { name: 'Old Name' }
      const newValues = { name: 'New Name' }
      const rowData = createMockAuditLog({
        old_values: JSON.stringify(oldValues),
        new_values: JSON.stringify(newValues),
      })

      const audit = AuditLog.fromRow(rowData)
      expect(audit.old_values).toEqual(oldValues)
      expect(audit.new_values).toEqual(newValues)
    })

    it('should handle null values in fromRow', () => {
      const rowData = createMockAuditLog({
        old_values: null,
        new_values: null,
        user_id: null,
        ip_address: null,
        user_agent: null,
      })

      const audit = AuditLog.fromRow(rowData)
      expect(audit.old_values).toBeNull()
      expect(audit.new_values).toBeNull()
      expect(audit.user_id).toBeNull()
      expect(audit.ip_address).toBeNull()
      expect(audit.user_agent).toBeNull()
    })
  })

  describe('Factory Methods', () => {
    it('should create login audit log', () => {
      const audit = AuditLog.login('user-123', '127.0.0.1', 'test-agent', true)

      expect(audit.action).toBe('login')
      expect(audit.user_id).toBe('user-123')
      expect(audit.resource_type).toBe('user')
      expect(audit.resource_id).toBe('user-123')
      expect(audit.success).toBe(true)
      expect(audit.error_message).toBeNull()
    })

    it('should create failed login audit log', () => {
      const audit = AuditLog.login('user-123', '127.0.0.1', 'test-agent', false)

      expect(audit.action).toBe('login')
      expect(audit.success).toBe(false)
      expect(audit.error_message).toBe('Login failed')
    })

    it('should create tool execution audit log', () => {
      const inputData = { query: 'SELECT * FROM users' }
      const audit = AuditLog.toolExecute(
        'user-123',
        'tool-456',
        inputData,
        '127.0.0.1',
        'test-agent',
        true
      )

      expect(audit.action).toBe('tool_execute')
      expect(audit.user_id).toBe('user-123')
      expect(audit.resource_type).toBe('tool')
      expect(audit.resource_id).toBe('tool-456')
      expect(audit.success).toBe(true)
      expect(audit.new_values).toEqual({
        input_size: JSON.stringify(inputData).length,
      })
    })

    it('should create failed tool execution audit log', () => {
      const inputData = { invalid: 'data' }
      const audit = AuditLog.toolExecute(
        'user-123',
        'tool-456',
        inputData,
        '127.0.0.1',
        'test-agent',
        false,
        'Invalid input data'
      )

      expect(audit.action).toBe('tool_execute')
      expect(audit.success).toBe(false)
      expect(audit.error_message).toBe('Invalid input data')
    })

    it('should create file upload audit log', () => {
      const audit = AuditLog.fileUpload(
        'user-123',
        'file-456',
        'document.pdf',
        1024 * 1024,
        '127.0.0.1',
        'test-agent',
        true
      )

      expect(audit.action).toBe('file_upload')
      expect(audit.resource_type).toBe('file_upload')
      expect(audit.resource_id).toBe('file-456')
      expect(audit.success).toBe(true)
      expect(audit.new_values).toEqual({
        filename: 'document.pdf',
        file_size: 1024 * 1024,
      })
    })

    it('should create auth failure audit log', () => {
      const audit = AuditLog.authFailure(
        'test@example.com',
        'Invalid password',
        '127.0.0.1',
        'test-agent'
      )

      expect(audit.action).toBe('auth_failure')
      expect(audit.user_id).toBeNull()
      expect(audit.success).toBe(false)
      expect(audit.new_values).toEqual({
        identifier: 'test@example.com',
        reason: 'Invalid password',
      })
      expect(audit.error_message).toBe('Invalid password')
    })

    it('should create quota exceeded audit log', () => {
      const audit = AuditLog.quotaExceeded('user-123', 'api_requests', '127.0.0.1', 'test-agent')

      expect(audit.action).toBe('quota_exceeded')
      expect(audit.resource_type).toBe('quota_counter')
      expect(audit.success).toBe(false)
      expect(audit.new_values).toEqual({ quota_type: 'api_requests' })
    })

    it('should create security event audit log', () => {
      const details = { threat_level: 'high', source: 'external' }
      const audit = AuditLog.securityEvent(
        'suspicious_activity',
        details,
        'user-123',
        '127.0.0.1',
        'test-agent'
      )

      expect(audit.action).toBe('security_event')
      expect(audit.resource_type).toBe('system_config')
      expect(audit.success).toBe(true)
      expect(audit.new_values).toEqual({
        event: 'suspicious_activity',
        ...details,
      })
    })

    it('should create data change audit log', () => {
      const oldValues = { name: 'Old Name', email: 'old@example.com' }
      const newValues = { name: 'New Name', email: 'new@example.com' }
      const audit = AuditLog.dataChange(
        'user-123',
        'user',
        'user-456',
        oldValues,
        newValues,
        '127.0.0.1',
        'test-agent'
      )

      expect(audit.action).toBe('admin_action')
      expect(audit.resource_type).toBe('user')
      expect(audit.resource_id).toBe('user-456')
      expect(audit.old_values).toEqual(oldValues)
      expect(audit.new_values).toEqual(newValues)
    })
  })

  describe('Helper Methods and Business Logic', () => {
    it('should correctly identify successful and failed audits', () => {
      const successAudit = new AuditLog(createMockAuditLog({ success: true }))
      const failedAudit = new AuditLog(createMockAuditLog({ success: false }))

      expect(successAudit.isSuccessful).toBe(true)
      expect(successAudit.isFailed).toBe(false)
      expect(failedAudit.isSuccessful).toBe(false)
      expect(failedAudit.isFailed).toBe(true)
    })

    it('should correctly identify anonymous audits', () => {
      const userAudit = new AuditLog(createMockAuditLog({ user_id: 'user-123' }))
      const anonymousAudit = new AuditLog(createMockAuditLog({ user_id: null }))

      expect(userAudit.isAnonymous).toBe(false)
      expect(anonymousAudit.isAnonymous).toBe(true)
    })

    it('should correctly identify security events', () => {
      const securityEvents = [
        'auth_failure',
        'permission_denied',
        'quota_exceeded',
        'rate_limit_hit',
        'security_event',
      ]

      securityEvents.forEach(action => {
        const audit = new AuditLog(createMockAuditLog({ action: action as any }))
        expect(audit.isSecurityEvent).toBe(true)
      })

      const nonSecurityAudit = new AuditLog(createMockAuditLog({ action: 'tool_execute' }))
      expect(nonSecurityAudit.isSecurityEvent).toBe(false)
    })

    it('should correctly identify data access events', () => {
      const dataAccessEvents = ['file_upload', 'file_download', 'data_export', 'data_delete']

      dataAccessEvents.forEach(action => {
        const audit = new AuditLog(createMockAuditLog({ action: action as any }))
        expect(audit.isDataAccess).toBe(true)
      })

      const nonDataAccessAudit = new AuditLog(createMockAuditLog({ action: 'login' }))
      expect(nonDataAccessAudit.isDataAccess).toBe(false)
    })

    it('should correctly identify administrative events', () => {
      const adminEvents = ['admin_action', 'config_change']

      adminEvents.forEach(action => {
        const audit = new AuditLog(createMockAuditLog({ action: action as any }))
        expect(audit.isAdministrative).toBe(true)
      })

      const nonAdminAudit = new AuditLog(createMockAuditLog({ action: 'tool_execute' }))
      expect(nonAdminAudit.isAdministrative).toBe(false)
    })

    it('should return correct action descriptions', () => {
      const descriptions: Record<string, string> = {
        login: 'User login attempt',
        tool_execute: 'Tool execution',
        file_upload: 'File upload',
        auth_failure: 'Authentication failure',
        security_event: 'Security event',
      }

      Object.entries(descriptions).forEach(([action, expectedDesc]) => {
        const audit = new AuditLog(createMockAuditLog({ action: action as any }))
        expect(audit.actionDescription).toBe(expectedDesc)
      })
    })

    it('should return correct resource descriptions', () => {
      const auditWithId = new AuditLog(
        createMockAuditLog({
          resource_type: 'tool',
          resource_id: 'tool-123',
        })
      )
      const auditWithoutId = new AuditLog(
        createMockAuditLog({
          resource_type: 'user',
          resource_id: null,
        })
      )

      expect(auditWithId.resourceDescription).toBe('tool:tool-123')
      expect(auditWithoutId.resourceDescription).toBe('user')
    })

    it('should format timestamp correctly', () => {
      const timestamp = Math.floor(new Date('2023-12-01T12:30:00Z').getTime() / 1000)
      const audit = new AuditLog(createMockAuditLog({ created_at: timestamp }))

      expect(audit.timestampString).toBe('2023-12-01T12:30:00.000Z')
    })

    it('should generate change summary correctly', () => {
      const oldValues = { name: 'Old Name', status: 'active' }
      const newValues = { name: 'New Name', status: 'inactive', role: 'admin' }

      const audit = new AuditLog(createMockAuditLog({ oldValues, newValues }))

      const summary = audit.changeSummary
      expect(summary).toContain('name: "Old Name" → "New Name"')
      expect(summary).toContain('status: "active" → "inactive"')
      expect(summary).toContain('role: → "admin"')
    })

    it('should return null change summary when no changes', () => {
      const audit = new AuditLog(createMockAuditLog({ old_values: null, new_values: null }))
      expect(audit.changeSummary).toBeNull()
    })
  })

  describe('Analytics Methods', () => {
    it('should filter security events correctly', () => {
      const audits = [
        new AuditLog(createMockAuditLog({ action: 'login' })),
        new AuditLog(createMockAuditLog({ action: 'auth_failure' })),
        new AuditLog(createMockAuditLog({ action: 'security_event' })),
        new AuditLog(createMockAuditLog({ action: 'tool_execute' })),
      ]

      const securityEvents = AuditLog.getSecurityEvents(audits)

      expect(securityEvents).toHaveLength(2)
      expect(securityEvents[0].action).toBe('auth_failure')
      expect(securityEvents[1].action).toBe('security_event')
    })

    it('should filter failed logins correctly', () => {
      const audits = [
        new AuditLog(createMockAuditLog({ action: 'login', success: true })),
        new AuditLog(createMockAuditLog({ action: 'login', success: false })),
        new AuditLog(createMockAuditLog({ action: 'login', success: false })),
        new AuditLog(createMockAuditLog({ action: 'logout', success: true })),
      ]

      const failedLogins = AuditLog.getFailedLogins(audits)

      expect(failedLogins).toHaveLength(2)
      expect(failedLogins.every(audit => audit.action === 'login' && audit.success === false)).toBe(
        true
      )
    })

    it('should filter data access logs correctly', () => {
      const audits = [
        new AuditLog(createMockAuditLog({ action: 'file_upload' })),
        new AuditLog(createMockAuditLog({ action: 'file_download' })),
        new AuditLog(createMockAuditLog({ action: 'data_export' })),
        new AuditLog(createMockAuditLog({ action: 'tool_execute' })),
      ]

      const dataAccessLogs = AuditLog.getDataAccessLogs(audits)

      expect(dataAccessLogs).toHaveLength(3)
      expect(dataAccessLogs.every(audit => audit.isDataAccess)).toBe(true)
    })

    it('should filter admin actions correctly', () => {
      const audits = [
        new AuditLog(createMockAuditLog({ action: 'admin_action' })),
        new AuditLog(createMockAuditLog({ action: 'config_change' })),
        new AuditLog(createMockAuditLog({ action: 'login' })),
      ]

      const adminActions = AuditLog.getAdminActions(audits)

      expect(adminActions).toHaveLength(2)
      expect(adminActions.every(audit => audit.isAdministrative)).toBe(true)
    })

    it('should calculate action stats correctly', () => {
      const audits = [
        new AuditLog(createMockAuditLog({ action: 'login', success: true })),
        new AuditLog(createMockAuditLog({ action: 'login', success: false })),
        new AuditLog(createMockAuditLog({ action: 'tool_execute', success: true })),
        new AuditLog(createMockAuditLog({ action: 'tool_execute', success: true })),
      ]

      const stats = AuditLog.getActionStats(audits)

      expect(stats.login.count).toBe(2)
      expect(stats.login.success_rate).toBe(50)
      expect(stats.tool_execute.count).toBe(2)
      expect(stats.tool_execute.success_rate).toBe(100)
    })

    it('should generate user activity summary correctly', () => {
      const audits = [
        new AuditLog(
          createMockAuditLog({
            user_id: 'user-1',
            action: 'login',
            created_at: Math.floor(Date.now() / 1000) - 3600,
          })
        ),
        new AuditLog(
          createMockAuditLog({
            user_id: 'user-1',
            action: 'tool_execute',
            success: false,
            created_at: Math.floor(Date.now() / 1000) - 1800,
          })
        ),
        new AuditLog(
          createMockAuditLog({
            user_id: 'user-2',
            action: 'login',
            created_at: Math.floor(Date.now() / 1000) - 900,
          })
        ),
        new AuditLog(
          createMockAuditLog({
            user_id: null,
            action: 'auth_failure',
          })
        ),
      ]

      const summary = AuditLog.getUserActivitySummary(audits)

      expect(summary).toHaveLength(2)

      const user1Summary = summary.find(s => s.user_id === 'user-1')!
      expect(user1Summary.total_actions).toBe(2)
      expect(user1Summary.successful_actions).toBe(1)
      expect(user1Summary.failed_actions).toBe(1)
      expect(user1Summary.unique_actions.has('login')).toBe(true)
      expect(user1Summary.unique_actions.has('tool_execute')).toBe(true)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing optional fields', () => {
      const minimalAuditData = {
        id: 'audit-123',
        user_id: null,
        action: 'login',
        resource_type: 'user',
        resource_id: null,
        old_values: null,
        new_values: null,
        ip_address: null,
        user_agent: null,
        success: true,
        error_message: null,
        created_at: 1234567890,
      }

      const audit = new AuditLog(minimalAuditData)

      expect(audit.user_id).toBeNull()
      expect(audit.resource_id).toBeNull()
      expect(audit.old_values).toBeNull()
      expect(audit.new_values).toBeNull()
      expect(audit.ip_address).toBeNull()
      expect(audit.user_agent).toBeNull()
    })

    it('should handle invalid data in fromRow', () => {
      const invalidRow = {
        id: 'invalid-uuid',
        user_id: 'invalid-uuid',
        action: 'invalid',
        resource_type: 'invalid',
        success: 'not_boolean',
      }

      expect(() => AuditLog.fromRow(invalidRow)).toThrow()
    })

    it('should handle malformed JSON in values fields', () => {
      const rowData = createMockAuditLog({
        old_values: 'invalid json string',
        new_values: 'also invalid',
      })

      expect(() => AuditLog.fromRow(rowData)).toThrow()
    })

    it('should handle empty change objects', () => {
      const audit = new AuditLog(
        createMockAuditLog({
          old_values: {},
          new_values: {},
        })
      )

      expect(audit.changeSummary).toBeNull()
    })
  })

  describe('SQL Queries', () => {
    it('should have all required SQL queries', () => {
      expect(AUDIT_LOG_QUERIES.CREATE_TABLE).toBeDefined()
      expect(AUDIT_LOG_QUERIES.INSERT).toBeDefined()
      expect(AUDIT_LOG_QUERIES.SELECT_BY_ID).toBeDefined()
      expect(AUDIT_LOG_QUERIES.SELECT_BY_USER).toBeDefined()
      expect(AUDIT_LOG_QUERIES.SELECT_BY_ACTION).toBeDefined()
      expect(AUDIT_LOG_QUERIES.SELECT_BY_RESOURCE).toBeDefined()
      expect(AUDIT_LOG_QUERIES.SELECT_FAILED).toBeDefined()
      expect(AUDIT_LOG_QUERIES.SELECT_SECURITY_EVENTS).toBeDefined()
      expect(AUDIT_LOG_QUERIES.DELETE_OLD_LOGS).toBeDefined()
    })

    it('should have proper table creation query', () => {
      expect(AUDIT_LOG_QUERIES.CREATE_TABLE).toContain('CREATE TABLE IF NOT EXISTS audit_logs')
      expect(AUDIT_LOG_QUERIES.CREATE_TABLE).toContain('id TEXT PRIMARY KEY')
      expect(AUDIT_LOG_QUERIES.CREATE_TABLE).toContain('FOREIGN KEY (user_id) REFERENCES users(id)')
    })

    it('should have parameterized queries', () => {
      expect(AUDIT_LOG_QUERIES.INSERT).toContain('VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      expect(AUDIT_LOG_QUERIES.SELECT_BY_ID).toContain('WHERE id = ?')
      expect(AUDIT_LOG_QUERIES.SELECT_BY_USER).toContain('WHERE user_id = ?')
      expect(AUDIT_LOG_QUERIES.DELETE).toContain('WHERE id = ?')
    })
  })

  describe('Integration with Mock Database', () => {
    it('should work with mock database operations', async () => {
      const auditData = createMockAuditLog()
      mockDb.setTableData('audit_logs', [auditData])

      // Test SELECT by ID
      const selectStmt = mockDb.prepare(AUDIT_LOG_QUERIES.SELECT_BY_ID).bind(auditData.id)
      const result = await selectStmt.first()

      expect(result).toEqual(auditData)
    })

    it('should handle audit log creation through mock database', async () => {
      const auditData = createMockAuditLog()

      // Test INSERT
      const insertStmt = mockDb
        .prepare(AUDIT_LOG_QUERIES.INSERT)
        .bind(
          auditData.id,
          auditData.user_id,
          auditData.action,
          auditData.resource_type,
          auditData.resource_id,
          JSON.stringify(auditData.old_values),
          JSON.stringify(auditData.new_values),
          auditData.ip_address,
          auditData.user_agent,
          auditData.success,
          auditData.error_message,
          auditData.created_at
        )

      const result = await insertStmt.run()
      expect(result.success).toBe(true)
      expect(result.meta.changes).toBe(1)
    })

    it('should handle audit log lookup by user', async () => {
      const auditData = createMockAuditLog({ user_id: 'user-123' })
      mockDb.setTableData('audit_logs', [auditData])

      // Test SELECT by user
      const selectStmt = mockDb.prepare(AUDIT_LOG_QUERIES.SELECT_BY_USER).bind('user-123', 10, 0)
      const result = await selectStmt.all()

      expect(result.results).toHaveLength(1)
      expect(result.results[0]).toEqual(auditData)
    })

    it('should handle audit log lookup by action', async () => {
      const auditData = createMockAuditLog({ action: 'login' })
      mockDb.setTableData('audit_logs', [auditData])

      // Test SELECT by action
      const selectStmt = mockDb.prepare(AUDIT_LOG_QUERIES.SELECT_BY_ACTION).bind('login', 10, 0)
      const result = await selectStmt.all()

      expect(result.results).toHaveLength(1)
      expect(result.results[0]).toEqual(auditData)
    })

    it('should handle security events selection', async () => {
      const securityEvents = [
        createMockAuditLog({ action: 'auth_failure' }),
        createMockAuditLog({ action: 'security_event' }),
        createMockAuditLog({ action: 'login' }),
      ]
      mockDb.setTableData('audit_logs', securityEvents)

      // Test SELECT security events
      const selectStmt = mockDb.prepare(AUDIT_LOG_QUERIES.SELECT_SECURITY_EVENTS).bind(10, 0)
      const result = await selectStmt.all()

      expect(result.results).toHaveLength(2)
      expect(
        result.results.every(
          row => row.action === 'auth_failure' || row.action === 'security_event'
        )
      ).toBe(true)
    })
  })
})
