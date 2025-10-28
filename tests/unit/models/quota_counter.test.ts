import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  QUOTA_COUNTER_QUERIES,
  QuotaCounter,
  QuotaCounterSchema,
  QuotaLimitSchema,
  QuotaUsageSchema,
} from '../../../../apps/api/src/models/quota_counter'
import {
  cleanupTestEnvironment,
  createMockQuotaCounter,
  createTestDatabase,
  setupTestEnvironment,
} from './database.mock'

describe('QuotaCounter Model', () => {
  let mockDb: any

  beforeEach(() => {
    setupTestEnvironment()
    mockDb = createTestDatabase()
  })

  afterEach(() => {
    cleanupTestEnvironment()
  })

  describe('Schema Validation', () => {
    it('should validate a complete quota counter object', () => {
      const quotaData = createMockQuotaCounter()
      const result = QuotaCounterSchema.safeParse(quotaData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe(quotaData.id)
        expect(result.data.user_id).toBe(quotaData.user_id)
        expect(result.data.quota_type).toBe(quotaData.quota_type)
      }
    })

    it('should reject invalid quota type', () => {
      const invalidQuota = createMockQuotaCounter({
        quota_type: 'invalid' as any,
      })
      const result = QuotaCounterSchema.safeParse(invalidQuota)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('quota_type')
      }
    })

    it('should accept valid quota types', () => {
      const validTypes = [
        'api_requests',
        'file_uploads',
        'execution_time',
        'bandwidth',
        'storage',
        'jobs_per_hour',
        'file_size',
      ]

      validTypes.forEach(type => {
        const quota = createMockQuotaCounter({ quota_type: type as any })
        const result = QuotaCounterSchema.safeParse(quota)
        expect(result.success).toBe(true)
      })
    })

    it('should accept valid quota periods', () => {
      const validPeriods = ['minute', 'hour', 'day', 'week', 'month', 'year']

      validPeriods.forEach(period => {
        // Test period creation
        const periodInfo = QuotaCounter.createPeriod('api_requests' as any, period as any)
        expect(periodInfo.period_start).toBeDefined()
        expect(periodInfo.period_end).toBeDefined()
      })
    })

    it('should validate quota limit schema', () => {
      const limitData = {
        type: 'api_requests',
        period: 'hour',
        limit: 1000,
        window_minutes: 60,
        applies_to_anonymous: true,
        applies_to_authenticated: true,
        user_tier_multipliers: { free: 1, pro: 10, enterprise: 100 },
      }

      const result = QuotaLimitSchema.safeParse(limitData)
      expect(result.success).toBe(true)
    })

    it('should validate quota usage schema', () => {
      const usageData = {
        quota_type: 'api_requests',
        used: 50,
        limit: 100,
        remaining: 50,
        reset_time: Math.floor(Date.now() / 1000) + 3600,
        period_seconds: 3600,
        is_anonymous: false,
      }

      const result = QuotaUsageSchema.safeParse(usageData)
      expect(result.success).toBe(true)
    })
  })

  describe('Model Creation and Instantiation', () => {
    it('should create a quota counter instance with valid data', () => {
      const quotaData = createMockQuotaCounter()
      const quota = new QuotaCounter(quotaData)

      expect(quota.id).toBe(quotaData.id)
      expect(quota.user_id).toBe(quotaData.user_id)
      expect(quota.quota_type).toBe(quotaData.quota_type)
      expect(quota.limit_count).toBe(quotaData.limit_count)
      expect(quota.used_count).toBe(quotaData.used_count)
    })

    it('should create a quota counter with static create method', () => {
      const createData = {
        user_id: 'user-456',
        quota_type: 'file_uploads' as const,
        period_start: Math.floor(Date.now() / 1000),
        period_end: Math.floor(Date.now() / 1000) + 3600,
        limit_count: 50,
        ip_address: '127.0.0.1',
      }

      const quota = QuotaCounter.create(createData)

      expect(quota.id).toBeDefined()
      expect(quota.user_id).toBe(createData.user_id)
      expect(quota.quota_type).toBe(createData.quota_type)
      expect(quota.used_count).toBe(0)
      expect(quota.created_at).toBeDefined()
      expect(quota.updated_at).toBeDefined()
    })

    it('should create quota counter from database row', () => {
      const rowData = createMockQuotaCounter()
      mockDb.setTableData('quota_counters', [rowData])

      const quota = QuotaCounter.fromRow(rowData)

      expect(quota).toBeInstanceOf(QuotaCounter)
      expect(quota.id).toBe(rowData.id)
      expect(quota.quota_type).toBe(rowData.quota_type)
    })
  })

  describe('Factory Methods', () => {
    it('should create quota counter for user', () => {
      const quota = QuotaCounter.createForUser('user-123', 'api_requests', 'hour', 1000)

      expect(quota.user_id).toBe('user-123')
      expect(quota.quota_type).toBe('api_requests')
      expect(quota.limit_count).toBe(1000)
      expect(quota.ip_address).toBeNull()
      expect(quota.period_end).toBeGreaterThan(quota.period_start)
    })

    it('should create quota counter for anonymous user', () => {
      const quota = QuotaCounter.createForAnonymous('127.0.0.1', 'api_requests', 'hour', 100)

      expect(quota.user_id).toBeNull()
      expect(quota.ip_address).toBe('127.0.0.1')
      expect(quota.quota_type).toBe('api_requests')
      expect(quota.limit_count).toBe(100)
    })

    it('should create different period types correctly', () => {
      const now = Math.floor(Date.now() / 1000)

      const minuteQuota = QuotaCounter.createForUser('user-123', 'api_requests', 'minute', 60, now)
      const hourQuota = QuotaCounter.createForUser('user-123', 'api_requests', 'hour', 3600, now)
      const dayQuota = QuotaCounter.createForUser('user-123', 'api_requests', 'day', 86400, now)

      expect(minuteQuota.period_end - minuteQuota.period_start).toBe(60)
      expect(hourQuota.period_end - hourQuota.period_start).toBe(3600)
      expect(dayQuota.period_end - dayQuota.period_start).toBe(86400)
    })
  })

  describe('Quota Management Methods', () => {
    it('should increment usage correctly', () => {
      const quotaData = createMockQuotaCounter({ used_count: 10 })
      const quota = new QuotaCounter(quotaData)

      const incrementedQuota = quota.increment(5)

      expect(incrementedQuota.used_count).toBe(15)
    })

    it('should decrement usage correctly', () => {
      const quotaData = createMockQuotaCounter({ used_count: 10 })
      const quota = new QuotaCounter(quotaData)

      const decrementedQuota = quota.decrement(3)

      expect(decrementedQuota.used_count).toBe(7)
    })

    it('should not allow negative usage', () => {
      const quotaData = createMockQuotaCounter({ used_count: 5 })
      const quota = new QuotaCounter(quotaData)

      const decrementedQuota = quota.decrement(10)

      expect(decrementedQuota.used_count).toBe(0)
    })

    it('should reset usage correctly', () => {
      const quotaData = createMockQuotaCounter({ used_count: 50 })
      const quota = new QuotaCounter(quotaData)

      const resetQuota = quota.reset()

      expect(resetQuota.used_count).toBe(0)
    })

    it('should set limit correctly', () => {
      const quotaData = createMockQuotaCounter({ limit_count: 100 })
      const quota = new QuotaCounter(quotaData)

      const updatedQuota = quota.setLimit(200)

      expect(updatedQuota.limit_count).toBe(200)
    })
  })

  describe('Helper Methods and Business Logic', () => {
    it('should correctly identify exceeded quota', () => {
      const underLimitQuota = new QuotaCounter(
        createMockQuotaCounter({ used_count: 50, limit_count: 100 })
      )
      const atLimitQuota = new QuotaCounter(
        createMockQuotaCounter({ used_count: 100, limit_count: 100 })
      )
      const overLimitQuota = new QuotaCounter(
        createMockQuotaCounter({ used_count: 150, limit_count: 100 })
      )

      expect(underLimitQuota.isExceeded).toBe(false)
      expect(atLimitQuota.isExceeded).toBe(true)
      expect(overLimitQuota.isExceeded).toBe(true)
    })

    it('should correctly identify near limit quota', () => {
      const lowUsageQuota = new QuotaCounter(
        createMockQuotaCounter({ used_count: 50, limit_count: 100 })
      )
      const nearLimitQuota = new QuotaCounter(
        createMockQuotaCounter({ used_count: 90, limit_count: 100 })
      )
      const atLimitQuota = new QuotaCounter(
        createMockQuotaCounter({ used_count: 100, limit_count: 100 })
      )

      expect(lowUsageQuota.isNearLimit).toBe(false)
      expect(nearLimitQuota.isNearLimit).toBe(true)
      expect(atLimitQuota.isNearLimit).toBe(true)
    })

    it('should calculate remaining quota correctly', () => {
      const quota1 = new QuotaCounter(createMockQuotaCounter({ used_count: 30, limit_count: 100 }))
      const quota2 = new QuotaCounter(createMockQuotaCounter({ used_count: 120, limit_count: 100 }))

      expect(quota1.remaining).toBe(70)
      expect(quota2.remaining).toBe(0)
    })

    it('should calculate usage percentage correctly', () => {
      const quota1 = new QuotaCounter(createMockQuotaCounter({ used_count: 25, limit_count: 100 }))
      const quota2 = new QuotaCounter(createMockQuotaCounter({ used_count: 75, limit_count: 100 }))
      const quota3 = new QuotaCounter(createMockQuotaCounter({ used_count: 150, limit_count: 100 }))
      const quota4 = new QuotaCounter(createMockQuotaCounter({ used_count: 0, limit_count: 0 }))

      expect(quota1.usagePercentage).toBe(25)
      expect(quota2.usagePercentage).toBe(75)
      expect(quota3.usagePercentage).toBe(100)
      expect(quota4.usagePercentage).toBe(0)
    })

    it('should correctly identify expired quota', () => {
      const now = Math.floor(Date.now() / 1000)
      const validQuota = new QuotaCounter(
        createMockQuotaCounter({
          period_end: now + 3600,
        })
      )
      const expiredQuota = new QuotaCounter(
        createMockQuotaCounter({
          period_end: now - 3600,
        })
      )

      expect(validQuota.isExpired).toBe(false)
      expect(expiredQuota.isExpired).toBe(true)
    })

    it('should calculate time until reset correctly', () => {
      const now = Math.floor(Date.now() / 1000)
      const futureQuota = new QuotaCounter(
        createMockQuotaCounter({
          period_end: now + 1800, // 30 minutes from now
        })
      )
      const pastQuota = new QuotaCounter(
        createMockQuotaCounter({
          period_end: now - 1800, // 30 minutes ago
        })
      )

      expect(futureQuota.timeUntilReset).toBeGreaterThan(0)
      expect(futureQuota.timeUntilReset).toBeLessThanOrEqual(1800)
      expect(pastQuota.timeUntilReset).toBe(0)
    })

    it('should format time until reset correctly', () => {
      const now = Math.floor(Date.now() / 1000)
      const secondsQuota = new QuotaCounter(
        createMockQuotaCounter({
          period_end: now + 30,
        })
      )
      const minutesQuota = new QuotaCounter(
        createMockQuotaCounter({
          period_end: now + 150, // 2.5 minutes
        })
      )
      const hoursQuota = new QuotaCounter(
        createMockQuotaCounter({
          period_end: now + 7200, // 2 hours
        })
      )
      const expiredQuota = new QuotaCounter(
        createMockQuotaCounter({
          period_end: now - 3600,
        })
      )

      expect(secondsQuota.timeUntilResetString).toBe('30s')
      expect(minutesQuota.timeUntilResetString).toBe('2m 30s')
      expect(hoursQuota.timeUntilResetString).toBe('2h 0m')
      expect(expiredQuota.timeUntilResetString).toBe('Now')
    })

    it('should correctly identify anonymous quota', () => {
      const userQuota = new QuotaCounter(createMockQuotaCounter({ user_id: 'user-123' }))
      const anonymousQuota = new QuotaCounter(createMockQuotaCounter({ user_id: null }))

      expect(userQuota.isAnonymous).toBe(false)
      expect(anonymousQuota.isAnonymous).toBe(true)
    })
  })

  describe('Period Utilities', () => {
    it('should create correct periods for different types', () => {
      const baseTime = Math.floor(new Date('2023-12-01T12:30:00Z').getTime() / 1000)

      const minutePeriod = QuotaCounter.createPeriod('api_requests', 'minute', baseTime)
      const hourPeriod = QuotaCounter.createPeriod('api_requests', 'hour', baseTime)
      const dayPeriod = QuotaCounter.createPeriod('api_requests', 'day', baseTime)

      // Minute should align to the start of the minute
      expect(minutePeriod.period_start).toBe(
        Math.floor(new Date('2023-12-01T12:30:00Z').getTime() / 1000)
      )
      expect(minutePeriod.period_end - minutePeriod.period_start).toBe(60)

      // Hour should align to the start of the hour
      expect(hourPeriod.period_start).toBe(
        Math.floor(new Date('2023-12-01T12:00:00Z').getTime() / 1000)
      )
      expect(hourPeriod.period_end - hourPeriod.period_start).toBe(3600)

      // Day should align to the start of the day
      expect(dayPeriod.period_start).toBe(
        Math.floor(new Date('2023-12-01T00:00:00Z').getTime() / 1000)
      )
      expect(dayPeriod.period_end - dayPeriod.period_start).toBe(86400)
    })

    it('should handle week period correctly', () => {
      const baseTime = Math.floor(new Date('2023-12-06T12:30:00Z').getTime() / 1000) // Wednesday
      const weekPeriod = QuotaCounter.createPeriod('api_requests', 'week', baseTime)

      // Week should start on Sunday
      expect(weekPeriod.period_start).toBe(
        Math.floor(new Date('2023-12-03T00:00:00Z').getTime() / 1000)
      )
      expect(weekPeriod.period_end - weekPeriod.period_start).toBe(7 * 86400)
    })

    it('should handle month period correctly', () => {
      const baseTime = Math.floor(new Date('2023-12-15T12:30:00Z').getTime() / 1000)
      const monthPeriod = QuotaCounter.createPeriod('api_requests', 'month', baseTime)

      // Month should start on the 1st
      expect(monthPeriod.period_start).toBe(
        Math.floor(new Date('2023-12-01T00:00:00Z').getTime() / 1000)
      )
      expect(monthPeriod.period_end).toBe(
        Math.floor(new Date('2024-01-01T00:00:00Z').getTime() / 1000)
      )
    })

    it('should handle year period correctly', () => {
      const baseTime = Math.floor(new Date('2023-06-15T12:30:00Z').getTime() / 1000)
      const yearPeriod = QuotaCounter.createPeriod('api_requests', 'year', baseTime)

      // Year should start on Jan 1st
      expect(yearPeriod.period_start).toBe(
        Math.floor(new Date('2023-01-01T00:00:00Z').getTime() / 1000)
      )
      expect(yearPeriod.period_end).toBe(
        Math.floor(new Date('2024-01-01T00:00:00Z').getTime() / 1000)
      )
    })
  })

  describe('Default Limits', () => {
    it('should return default limits', () => {
      const limits = QuotaCounter.getDefaultLimits()

      expect(limits).toHaveLength(10)
      expect(limits[0].type).toBe('api_requests')
      expect(limits[0].period).toBe('hour')
      expect(limits[1].type).toBe('api_requests')
      expect(limits[1].period).toBe('day')
    })

    it('should find limit for type and period', () => {
      const limit = QuotaCounter.getLimitForType('api_requests', 'hour')

      expect(limit).toBeDefined()
      expect(limit?.type).toBe('api_requests')
      expect(limit?.period).toBe('hour')
    })

    it('should return null for unknown limit', () => {
      const limit = QuotaCounter.getLimitForType('unknown_type' as any, 'hour')

      expect(limit).toBeNull()
    })
  })

  describe('Usage Calculations', () => {
    it('should calculate usage correctly', () => {
      const usage = QuotaCounter.calculateUsage(
        'api_requests',
        'hour',
        25,
        100,
        Math.floor(Date.now() / 1000) + 3600,
        false
      )

      expect(usage.quota_type).toBe('api_requests')
      expect(usage.used).toBe(25)
      expect(usage.limit).toBe(100)
      expect(usage.remaining).toBe(75)
      expect(usage.is_anonymous).toBe(false)
    })
  })

  describe('SQL Queries', () => {
    it('should have all required SQL queries', () => {
      expect(QUOTA_COUNTER_QUERIES.CREATE_TABLE).toBeDefined()
      expect(QUOTA_COUNTER_QUERIES.INSERT).toBeDefined()
      expect(QUOTA_COUNTER_QUERIES.SELECT_BY_ID).toBeDefined()
      expect(QUOTA_COUNTER_QUERIES.SELECT_BY_USER_AND_TYPE).toBeDefined()
      expect(QUOTA_COUNTER_QUERIES.SELECT_BY_IP_AND_TYPE).toBeDefined()
      expect(QUOTA_COUNTER_QUERIES.UPDATE).toBeDefined()
      expect(QUOTA_COUNTER_QUERIES.DELETE).toBeDefined()
      expect(QUOTA_COUNTER_QUERIES.DELETE_EXPIRED).toBeDefined()
    })

    it('should have proper table creation query', () => {
      expect(QUOTA_COUNTER_QUERIES.CREATE_TABLE).toContain(
        'CREATE TABLE IF NOT EXISTS quota_counters'
      )
      expect(QUOTA_COUNTER_QUERIES.CREATE_TABLE).toContain('id TEXT PRIMARY KEY')
      expect(QUOTA_COUNTER_QUERIES.CREATE_TABLE).toContain(
        'FOREIGN KEY (user_id) REFERENCES users(id)'
      )
      expect(QUOTA_COUNTER_QUERIES.CREATE_TABLE).toContain(
        'UNIQUE(user_id, quota_type, period_start, ip_address)'
      )
    })

    it('should have parameterized queries', () => {
      expect(QUOTA_COUNTER_QUERIES.INSERT).toContain('VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      expect(QUOTA_COUNTER_QUERIES.SELECT_BY_ID).toContain('WHERE id = ?')
      expect(QUOTA_COUNTER_QUERIES.SELECT_BY_USER_AND_TYPE).toContain(
        'WHERE user_id = ? AND quota_type = ?'
      )
      expect(QUOTA_COUNTER_QUERIES.DELETE).toContain('WHERE id = ?')
    })
  })

  describe('Integration with Mock Database', () => {
    it('should work with mock database operations', async () => {
      const quotaData = createMockQuotaCounter()
      mockDb.setTableData('quota_counters', [quotaData])

      // Test SELECT by ID
      const selectStmt = mockDb.prepare(QUOTA_COUNTER_QUERIES.SELECT_BY_ID).bind(quotaData.id)
      const result = await selectStmt.first()

      expect(result).toEqual(quotaData)
    })

    it('should handle quota counter creation through mock database', async () => {
      const quotaData = createMockQuotaCounter()

      // Test INSERT
      const insertStmt = mockDb
        .prepare(QUOTA_COUNTER_QUERIES.INSERT)
        .bind(
          quotaData.id,
          quotaData.user_id,
          quotaData.quota_type,
          quotaData.period_start,
          quotaData.period_end,
          quotaData.used_count,
          quotaData.limit_count,
          quotaData.ip_address,
          quotaData.created_at,
          quotaData.updated_at
        )

      const result = await insertStmt.run()
      expect(result.success).toBe(true)
      expect(result.meta.changes).toBe(1)
    })

    it('should handle quota counter lookup by user and type', async () => {
      const quotaData = createMockQuotaCounter({
        user_id: 'user-123',
        quota_type: 'api_requests',
      })
      mockDb.setTableData('quota_counters', [quotaData])

      const now = Math.floor(Date.now() / 1000)

      // Test SELECT by user and type
      const selectStmt = mockDb
        .prepare(QUOTA_COUNTER_QUERIES.SELECT_BY_USER_AND_TYPE)
        .bind('user-123', 'api_requests', now, now)
      const result = await selectStmt.first()

      expect(result).toEqual(quotaData)
    })

    it('should handle quota counter lookup by IP and type', async () => {
      const quotaData = createMockQuotaCounter({
        user_id: null,
        ip_address: '127.0.0.1',
        quota_type: 'api_requests',
      })
      mockDb.setTableData('quota_counters', [quotaData])

      const now = Math.floor(Date.now() / 1000)

      // Test SELECT by IP and type
      const selectStmt = mockDb
        .prepare(QUOTA_COUNTER_QUERIES.SELECT_BY_IP_AND_TYPE)
        .bind('127.0.0.1', 'api_requests', now, now)
      const result = await selectStmt.first()

      expect(result).toEqual(quotaData)
    })
  })
})
