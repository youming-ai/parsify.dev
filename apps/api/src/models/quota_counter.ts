import { z } from 'zod'

// Quota types
export const QuotaTypeSchema = z.enum([
  'api_requests',
  'file_uploads',
  'execution_time',
  'bandwidth',
  'storage',
  'jobs_per_hour',
  'file_size'
])
export type QuotaType = z.infer<typeof QuotaTypeSchema>

// Quota period types
export const QuotaPeriodSchema = z.enum([
  'minute',
  'hour',
  'day',
  'week',
  'month',
  'year'
])
export type QuotaPeriod = z.infer<typeof QuotaPeriodSchema>

// Quota counter schema for validation
export const QuotaCounterSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  quota_type: QuotaTypeSchema,
  period_start: z.number(),
  period_end: z.number(),
  used_count: z.number().default(0),
  limit_count: z.number(),
  ip_address: z.string().ip().nullable(),
  created_at: z.number(),
  updated_at: z.number()
})

export type QuotaCounter = z.infer<typeof QuotaCounterSchema>

// Quota counter creation schema
export const CreateQuotaCounterSchema = QuotaCounterSchema.partial({
  id: true,
  used_count: true,
  created_at: true,
  updated_at: true
})

export type CreateQuotaCounter = z.infer<typeof CreateQuotaCounterSchema>

// Quota counter update schema
export const UpdateQuotaCounterSchema = QuotaCounterSchema.partial({
  id: true,
  user_id: true,
  quota_type: true,
  period_start: true,
  period_end: true,
  limit_count: true,
  ip_address: true,
  created_at: true
})

export type UpdateQuotaCounter = z.infer<typeof UpdateQuotaCounterSchema>

// Quota limit configuration
export const QuotaLimitSchema = z.object({
  type: QuotaTypeSchema,
  period: QuotaPeriodSchema,
  limit: z.number().min(1),
  window_minutes: z.number().min(1),
  applies_to_anonymous: z.boolean().default(true),
  applies_to_authenticated: z.boolean().default(true),
  user_tier_multipliers: z.record(z.number()).default({
    free: 1,
    pro: 10,
    enterprise: 100
  })
})

export type QuotaLimit = z.infer<typeof QuotaLimitSchema>

// Quota usage response
export const QuotaUsageSchema = z.object({
  quota_type: QuotaTypeSchema,
  used: z.number(),
  limit: z.number(),
  remaining: z.number(),
  reset_time: z.number(),
  period_seconds: z.number(),
  is_anonymous: z.boolean()
})

export type QuotaUsage = z.infer<typeof QuotaUsageSchema>

// Quota counter model class
export class QuotaCounter {
  public id: string
  public user_id: string | null
  public quota_type: QuotaType
  public period_start: number
  public period_end: number
  public used_count: number
  public limit_count: number
  public ip_address: string | null
  public created_at: number
  public updated_at: number

  constructor(data: QuotaCounter) {
    this.id = data.id
    this.user_id = data.user_id
    this.quota_type = data.quota_type
    this.period_start = data.period_start
    this.period_end = data.period_end
    this.used_count = data.used_count
    this.limit_count = data.limit_count
    this.ip_address = data.ip_address
    this.created_at = data.created_at
    this.updated_at = data.updated_at
  }

  // Static methods for database operations
  static create(data: CreateQuotaCounter): QuotaCounter {
    const now = Math.floor(Date.now() / 1000)
    return new QuotaCounter({
      id: crypto.randomUUID(),
      used_count: 0,
      created_at: now,
      updated_at: now,
      ...data
    })
  }

  static fromRow(row: any): QuotaCounter {
    return new QuotaCounter(QuotaCounterSchema.parse(row))
  }

  toRow(): Record<string, any> {
    return {
      id: this.id,
      user_id: this.user_id,
      quota_type: this.quota_type,
      period_start: this.period_start,
      period_end: this.period_end,
      used_count: this.used_count,
      limit_count: this.limit_count,
      ip_address: this.ip_address,
      created_at: this.created_at,
      updated_at: this.updated_at
    }
  }

  update(data: UpdateQuotaCounter): QuotaCounter {
    return new QuotaCounter({
      ...this,
      ...data,
      updated_at: Math.floor(Date.now() / 1000)
    })
  }

  // Quota management methods
  increment(amount: number = 1): QuotaCounter {
    return this.update({
      used_count: this.used_count + amount
    })
  }

  decrement(amount: number = 1): QuotaCounter {
    return this.update({
      used_count: Math.max(0, this.used_count - amount)
    })
  }

  reset(): QuotaCounter {
    return this.update({
      used_count: 0
    })
  }

  setLimit(newLimit: number): QuotaCounter {
    return this.update({
      limit_count: newLimit
    })
  }

  // Helper methods
  get isExceeded(): boolean {
    return this.used_count >= this.limit_count
  }

  get isNearLimit(): boolean {
    return this.used_count >= this.limit_count * 0.9
  }

  get remaining(): number {
    return Math.max(0, this.limit_count - this.used_count)
  }

  get usagePercentage(): number {
    if (this.limit_count === 0) return 0
    return Math.min(100, (this.used_count / this.limit_count) * 100)
  }

  get isExpired(): boolean {
    return Date.now() / 1000 > this.period_end
  }

  get timeUntilReset(): number {
    const now = Math.floor(Date.now() / 1000)
    return Math.max(0, this.period_end - now)
  }

  get timeUntilResetString(): string {
    const seconds = this.timeUntilReset
    if (seconds <= 0) return 'Now'

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  get isAnonymous(): boolean {
    return this.user_id === null
  }

  // Period utilities
  static createPeriod(
    quotaType: QuotaType,
    period: QuotaPeriod,
    startTime?: number
  ): { period_start: number; period_end: number } {
    const now = startTime || Math.floor(Date.now() / 1000)
    const date = new Date(now * 1000)

    let periodStart: Date
    let periodEnd: Date

    switch (period) {
      case 'minute':
        periodStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), 0, 0)
        periodEnd = new Date(periodStart.getTime() + 60 * 1000)
        break
      case 'hour':
        periodStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0, 0, 0)
        periodEnd = new Date(periodStart.getTime() + 60 * 60 * 1000)
        break
      case 'day':
        periodStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
        periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000)
        break
      case 'week':
        const dayOfWeek = date.getDay()
        periodStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - dayOfWeek, 0, 0, 0, 0)
        periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        periodStart = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)
        periodEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0)
        break
      case 'year':
        periodStart = new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0)
        periodEnd = new Date(date.getFullYear() + 1, 0, 1, 0, 0, 0, 0)
        break
    }

    return {
      period_start: Math.floor(periodStart.getTime() / 1000),
      period_end: Math.floor(periodEnd.getTime() / 1000)
    }
  }

  // Factory methods
  static createForUser(
    userId: string,
    quotaType: QuotaType,
    period: QuotaPeriod,
    limit: number,
    startTime?: number
  ): QuotaCounter {
    const periodInfo = QuotaCounter.createPeriod(quotaType, period, startTime)

    return QuotaCounter.create({
      user_id: userId,
      quota_type: quotaType,
      period_start: periodInfo.period_start,
      period_end: periodInfo.period_end,
      limit_count: limit,
      ip_address: null
    })
  }

  static createForAnonymous(
    ipAddress: string,
    quotaType: QuotaType,
    period: QuotaPeriod,
    limit: number,
    startTime?: number
  ): QuotaCounter {
    const periodInfo = QuotaCounter.createPeriod(quotaType, period, startTime)

    return QuotaCounter.create({
      user_id: null,
      quota_type: quotaType,
      period_start: periodInfo.period_start,
      period_end: periodInfo.period_end,
      limit_count: limit,
      ip_address: ipAddress
    })
  }

  // Quota limit definitions
  static getDefaultLimits(): QuotaLimit[] {
    return [
      {
        type: 'api_requests',
        period: 'hour',
        limit: 100,
        window_minutes: 60,
        applies_to_anonymous: true,
        applies_to_authenticated: true,
        user_tier_multipliers: { free: 1, pro: 5, enterprise: 20 }
      },
      {
        type: 'api_requests',
        period: 'day',
        limit: 1000,
        window_minutes: 1440,
        applies_to_anonymous: true,
        applies_to_authenticated: true,
        user_tier_multipliers: { free: 1, pro: 10, enterprise: 50 }
      },
      {
        type: 'file_uploads',
        period: 'hour',
        limit: 10,
        window_minutes: 60,
        applies_to_anonymous: true,
        applies_to_authenticated: true,
        user_tier_multipliers: { free: 1, pro: 5, enterprise: 20 }
      },
      {
        type: 'file_uploads',
        period: 'day',
        limit: 50,
        window_minutes: 1440,
        applies_to_anonymous: true,
        applies_to_authenticated: true,
        user_tier_multipliers: { free: 1, pro: 10, enterprise: 100 }
      },
      {
        type: 'execution_time',
        period: 'hour',
        limit: 30000, // 30 seconds in milliseconds
        window_minutes: 60,
        applies_to_anonymous: true,
        applies_to_authenticated: true,
        user_tier_multipliers: { free: 1, pro: 10, enterprise: 100 }
      },
      {
        type: 'execution_time',
        period: 'day',
        limit: 300000, // 5 minutes in milliseconds
        window_minutes: 1440,
        applies_to_anonymous: true,
        applies_to_authenticated: true,
        user_tier_multipliers: { free: 1, pro: 20, enterprise: 200 }
      },
      {
        type: 'bandwidth',
        period: 'day',
        limit: 100 * 1024 * 1024, // 100MB
        window_minutes: 1440,
        applies_to_anonymous: true,
        applies_to_authenticated: true,
        user_tier_multipliers: { free: 1, pro: 10, enterprise: 100 }
      },
      {
        type: 'storage',
        period: 'day',
        limit: 50 * 1024 * 1024, // 50MB
        window_minutes: 1440,
        applies_to_anonymous: true,
        applies_to_authenticated: true,
        user_tier_multipliers: { free: 1, pro: 20, enterprise: 200 }
      },
      {
        type: 'jobs_per_hour',
        period: 'hour',
        limit: 20,
        window_minutes: 60,
        applies_to_anonymous: true,
        applies_to_authenticated: true,
        user_tier_multipliers: { free: 1, pro: 5, enterprise: 20 }
      },
      {
        type: 'file_size',
        period: 'minute',
        limit: 10 * 1024 * 1024, // 10MB
        window_minutes: 1,
        applies_to_anonymous: true,
        applies_to_authenticated: true,
        user_tier_multipliers: { free: 1, pro: 5, enterprise: 50 }
      }
    ]
  }

  static getLimitForType(quotaType: QuotaType, period: QuotaPeriod): QuotaLimit | null {
    const limits = QuotaCounter.getDefaultLimits()
    return limits.find(limit => limit.type === quotaType && limit.period === period) || null
  }

  // Usage calculations
  static calculateUsage(
    quotaType: QuotaType,
    period: QuotaPeriod,
    usedCount: number,
    limitCount: number,
    periodEnd: number,
    isAnonymous: boolean
  ): QuotaUsage {
    return {
      quota_type: quotaType,
      used: usedCount,
      limit: limitCount,
      remaining: Math.max(0, limitCount - usedCount),
      reset_time: periodEnd,
      period_seconds: QuotaCounter.getPeriodSeconds(period),
      is_anonymous: isAnonymous
    }
  }

  private static getPeriodSeconds(period: QuotaPeriod): number {
    switch (period) {
      case 'minute': return 60
      case 'hour': return 60 * 60
      case 'day': return 24 * 60 * 60
      case 'week': return 7 * 24 * 60 * 60
      case 'month': return 30 * 24 * 60 * 60
      case 'year': return 365 * 24 * 60 * 60
    }
  }
}

// SQL queries
export const QUOTA_COUNTER_QUERIES = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS quota_counters (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      quota_type TEXT NOT NULL,
      period_start INTEGER NOT NULL,
      period_end INTEGER NOT NULL,
      used_count INTEGER DEFAULT 0,
      limit_count INTEGER NOT NULL,
      ip_address TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, quota_type, period_start, ip_address)
    );
  `,

  CREATE_INDEXES: [
    'CREATE INDEX IF NOT EXISTS idx_quota_counters_user_id ON quota_counters(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_quota_counters_period ON quota_counters(period_start, period_end);',
    'CREATE INDEX IF NOT EXISTS idx_quota_counters_type ON quota_counters(quota_type);',
    'CREATE INDEX IF NOT EXISTS idx_quota_counters_ip_address ON quota_counters(ip_address);',
    'CREATE INDEX IF NOT EXISTS idx_quota_counters_expires ON quota_counters(period_end);'
  ],

  INSERT: `
    INSERT OR REPLACE INTO quota_counters (id, user_id, quota_type, period_start, period_end, used_count, limit_count, ip_address, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `,

  SELECT_BY_ID: `
    SELECT * FROM quota_counters WHERE id = ?;
  `,

  SELECT_BY_USER_AND_TYPE: `
    SELECT * FROM quota_counters
    WHERE user_id = ? AND quota_type = ? AND period_start <= ? AND period_end > ?
    ORDER BY period_start DESC
    LIMIT 1;
  `,

  SELECT_BY_IP_AND_TYPE: `
    SELECT * FROM quota_counters
    WHERE ip_address = ? AND user_id IS NULL AND quota_type = ? AND period_start <= ? AND period_end > ?
    ORDER BY period_start DESC
    LIMIT 1;
  `,

  SELECT_BY_USER_AND_PERIOD: `
    SELECT * FROM quota_counters
    WHERE user_id = ? AND quota_type = ? AND period_start >= ? AND period_end <= ?
    ORDER BY period_start DESC;
  `,

  SELECT_ACTIVE_BY_USER: `
    SELECT * FROM quota_counters
    WHERE user_id = ? AND period_end > ?
    ORDER BY quota_type, period_start DESC;
  `,

  SELECT_ACTIVE_BY_IP: `
    SELECT * FROM quota_counters
    WHERE ip_address = ? AND user_id IS NULL AND period_end > ?
    ORDER BY quota_type, period_start DESC;
  `,

  UPDATE: `
    UPDATE quota_counters
    SET used_count = ?, limit_count = ?, updated_at = ?
    WHERE id = ?;
  `,

  UPDATE_USAGE: `
    UPDATE quota_counters
    SET used_count = used_count + ?, updated_at = ?
    WHERE id = ?;
  `,

  DELETE: `
    DELETE FROM quota_counters WHERE id = ?;
  `,

  DELETE_BY_USER: `
    DELETE FROM quota_counters WHERE user_id = ?;
  `,

  DELETE_EXPIRED: `
    DELETE FROM quota_counters WHERE period_end < ?;
  `,

  COUNT: `
    SELECT COUNT(*) as count FROM quota_counters;
  `,

  COUNT_BY_USER: `
    SELECT COUNT(*) as count FROM quota_counters WHERE user_id = ?;
  `,

  COUNT_BY_TYPE: `
    SELECT COUNT(*) as count FROM quota_counters WHERE quota_type = ?;
  `,

  // Analytics queries
  QUOTA_UTILIZATION: `
    SELECT
      quota_type,
      user_id IS NOT NULL as is_authenticated,
      AVG(used_count * 100.0 / limit_count) as avg_utilization_percent,
      MAX(used_count * 100.0 / limit_count) as max_utilization_percent,
      COUNT(*) as total_counters,
      COUNT(CASE WHEN used_count >= limit_count THEN 1 END) as exceeded_counters
    FROM quota_counters
    WHERE period_start >= ?
    GROUP BY quota_type, user_id IS NOT NULL
    ORDER BY quota_type, is_authenticated DESC;
  `,

  QUOTA_VIOLATIONS: `
    SELECT
      quota_type,
      user_id IS NOT NULL as is_authenticated,
      COUNT(*) as violation_count,
      DATE(created_at, 'unixepoch') as violation_date
    FROM quota_counters
    WHERE used_count >= limit_count AND created_at >= ?
    GROUP BY quota_type, user_id IS NOT NULL, DATE(created_at, 'unixepoch')
    ORDER BY violation_date DESC, violation_count DESC;
  `
} as const