import { AUDIT_LOG_QUERIES, AuditLog } from '../models/audit_log'
import {
  QUOTA_COUNTER_QUERIES,
  QuotaCounter,
  type QuotaLimit,
  type QuotaPeriod,
} from '../models/quota_counter'
import { USER_QUERIES, User } from '../models/user'
import type { CloudflareService } from './cloudflare/cloudflare-service'
import type { KVCacheService } from './cloudflare/kv-cache'

export interface RateLimitServiceOptions {
  db: D1Database
  kv: KVNamespace
  auditEnabled?: boolean
  defaultLimits?: Record<string, QuotaLimit>
  enableDistributedLimiting?: boolean
  cloudflareService?: CloudflareService
  enableAdvancedCaching?: boolean
}

export interface RateLimitCheck {
  allowed: boolean
  remaining: number
  limit: number
  resetTime: number
  retryAfter?: number
}

export interface RateLimitConfig {
  quotaType: string
  period: QuotaPeriod
  limit: number
  windowMinutes: number
  appliesToAnonymous: boolean
  appliesToAuthenticated: boolean
  userTierMultipliers?: Record<string, number>
}

export interface RateLimitOptions {
  identifier: string // User ID or IP address
  quotaType: string
  amount?: number // Amount to consume (default: 1)
  bypassForUser?: string // User ID to bypass rate limiting
  customLimit?: number // Custom limit override
  customPeriod?: QuotaPeriod
}

export interface RateLimitStats {
  quotaType: string
  totalRequests: number
  successfulRequests: number
  blockedRequests: number
  averageUsage: number
  peakUsage: number
  utilizationRate: number
}

export class RateLimitService {
  private db: D1Database
  private kv: KVNamespace
  private auditEnabled: boolean
  private defaultLimits: Record<string, QuotaLimit>
  private enableDistributedLimiting: boolean
  private cache: Map<string, RateLimitCheck> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  private cloudflareService: CloudflareService | null
  private cacheService: KVCacheService | null
  private enableAdvancedCaching: boolean

  constructor(options: RateLimitServiceOptions) {
    this.db = options.db
    this.kv = options.kv
    this.auditEnabled = options.auditEnabled ?? true
    this.defaultLimits = options.defaultLimits ?? this.getDefaultLimits()
    this.enableDistributedLimiting = options.enableDistributedLimiting ?? true
    this.cloudflareService = options.cloudflareService || null
    this.enableAdvancedCaching = options.enableAdvancedCaching ?? true
    this.cacheService = this.cloudflareService?.getKVCacheService() || null
  }

  // Rate limiting operations
  async checkRateLimit(options: RateLimitOptions): Promise<RateLimitCheck> {
    const { identifier, quotaType, amount = 1, bypassForUser, customLimit, customPeriod } = options

    // Bypass for specific users
    if (bypassForUser && identifier === bypassForUser) {
      return {
        allowed: true,
        remaining: Infinity,
        limit: Infinity,
        resetTime: Date.now() + 86400000, // 24 hours
      }
    }

    const cacheKey = `${identifier}:${quotaType}:${customPeriod || 'hour'}`

    // Try enhanced cache first
    if (this.cacheService && this.enableAdvancedCaching) {
      return this.cacheService.getOrSet(
        cacheKey,
        async () => {
          return this.calculateRateLimit(options)
        },
        {
          namespace: 'cache',
          ttl: 300, // 5 minutes
          tags: ['rate_limit', `quota_type:${quotaType}`],
          staleWhileRevalidate: false, // Rate limits need to be accurate
        }
      )
    }

    // Fallback to local cache
    const cached = this.cache.get(cacheKey)
    if (cached && !this.isCacheExpired(cacheKey)) {
      // Update remaining if within same period
      const updatedCache = await this.updateCachedResult(cached, amount)
      if (updatedCache) {
        this.cache.set(cacheKey, updatedCache)
        return updatedCache
      }
    }

    // Fallback to direct calculation if advanced caching is disabled
    return this.calculateRateLimit(options)
  }

  async consumeQuota(options: RateLimitOptions): Promise<RateLimitCheck> {
    const check = await this.checkRateLimit(options)

    if (check.allowed) {
      // Quota already consumed in checkRateLimit
      return check
    }

    return {
      ...check,
      error: 'Rate limit exceeded',
    }
  }

  async resetQuota(identifier: string, quotaType: string, period?: QuotaPeriod): Promise<void> {
    try {
      const actualPeriod = period || 'hour'
      const periodInfo = QuotaCounter.createPeriod(quotaType as any, actualPeriod)

      // Find existing quota counter
      const stmt = this.db.prepare(QUOTA_COUNTER_QUERIES.SELECT_BY_USER_AND_TYPE)
      const result = await stmt
        .bind(identifier, quotaType, periodInfo.period_start, periodInfo.period_end)
        .first()

      if (result) {
        const quotaCounter = QuotaCounter.fromRow(result)
        const resetCounter = quotaCounter.reset()
        await this.updateQuotaCounter(resetCounter)

        // Clear cache
        this.cache.delete(`${identifier}:${quotaType}:${actualPeriod}`)
      }
    } catch (error) {
      console.error('Failed to reset quota:', error)
    }
  }

  async getQuotaUsage(
    identifier: string,
    quotaType: string,
    period: QuotaPeriod = 'hour'
  ): Promise<{
    used: number
    limit: number
    remaining: number
    resetTime: number
    periodStart: number
    periodEnd: number
  }> {
    try {
      const quotaCounter = await this.getQuotaCounter(identifier, quotaType, period)

      if (!quotaCounter) {
        const limitConfig = this.getLimitConfig(quotaType, period)
        const actualLimit = limitConfig
          ? await this.calculateActualLimit(identifier, limitConfig)
          : 0

        const periodInfo = QuotaCounter.createPeriod(quotaType as any, period)
        return {
          used: 0,
          limit: actualLimit,
          remaining: actualLimit,
          resetTime: periodInfo.period_end * 1000,
          periodStart: periodInfo.period_start,
          periodEnd: periodInfo.period_end,
        }
      }

      return {
        used: quotaCounter.used_count,
        limit: quotaCounter.limit_count,
        remaining: quotaCounter.remaining,
        resetTime: quotaCounter.period_end * 1000,
        periodStart: quotaCounter.period_start,
        periodEnd: quotaCounter.period_end,
      }
    } catch (error) {
      console.error('Failed to get quota usage:', error)
      throw new Error(`Failed to get quota usage: ${error}`)
    }
  }

  async getQuotaStats(quotaType: string, period: QuotaPeriod = 'hour'): Promise<RateLimitStats> {
    try {
      const periodInfo = QuotaCounter.createPeriod(quotaType as any, period)
      const periodStart = periodInfo.period_start

      const stmt = this.db.prepare(`
        SELECT
          COUNT(*) as total_requests,
          COUNT(CASE WHEN used_count < limit_count THEN 1 END) as successful_requests,
          COUNT(CASE WHEN used_count >= limit_count THEN 1 END) as blocked_requests,
          AVG(used_count) as average_usage,
          MAX(used_count) as peak_usage,
          AVG(used_count * 100.0 / limit_count) as utilization_rate
        FROM quota_counters
        WHERE quota_type = ? AND period_start >= ?
        GROUP BY quota_type
      `)
      const result = await stmt.bind(quotaType, periodStart).first()

      if (!result) {
        return {
          quotaType,
          totalRequests: 0,
          successfulRequests: 0,
          blockedRequests: 0,
          averageUsage: 0,
          peakUsage: 0,
          utilizationRate: 0,
        }
      }

      return {
        quotaType,
        totalRequests: result.total_requests,
        successfulRequests: result.successful_requests,
        blockedRequests: result.blocked_requests,
        averageUsage: Math.round(result.average_usage || 0),
        peakUsage: result.peak_usage || 0,
        utilizationRate: Math.round((result.utilization_rate || 0) * 100) / 100,
      }
    } catch (error) {
      console.error('Failed to get quota stats:', error)
      throw new Error(`Failed to get quota stats: ${error}`)
    }
  }

  async getUserQuotas(userId: string): Promise<
    Record<
      string,
      {
        used: number
        limit: number
        remaining: number
        resetTime: number
        period: string
      }
    >
  > {
    const quotaTypes = [
      'api_requests',
      'file_uploads',
      'execution_time',
      'bandwidth',
      'storage',
      'jobs_per_hour',
    ]
    const quotas: Record<string, any> = {}

    for (const quotaType of quotaTypes) {
      try {
        const usage = await this.getQuotaUsage(userId, quotaType, 'hour')
        quotas[quotaType] = {
          ...usage,
          period: 'hour',
        }

        // Also get daily usage for some types
        if (['api_requests', 'execution_time', 'bandwidth'].includes(quotaType)) {
          const dailyUsage = await this.getQuotaUsage(userId, quotaType, 'day')
          quotas[`${quotaType}_daily`] = {
            ...dailyUsage,
            period: 'day',
          }
        }
      } catch (error) {
        console.error(`Failed to get quota for ${quotaType}:`, error)
        quotas[quotaType] = {
          used: 0,
          limit: 100,
          remaining: 100,
          resetTime: Date.now() + 3600000,
          period: 'hour',
        }
      }
    }

    return quotas
  }

  // Quota management
  async setUserQuotaOverride(
    userId: string,
    quotaType: string,
    newLimit: number,
    period: QuotaPeriod = 'hour'
  ): Promise<void> {
    try {
      const quotaCounter = await this.getQuotaCounter(userId, quotaType, period)

      if (quotaCounter) {
        // Update existing counter with new limit
        const updatedCounter = quotaCounter.setLimit(newLimit)
        await this.updateQuotaCounter(updatedCounter)
      } else {
        // Create new counter with custom limit
        await this.createQuotaCounter(userId, quotaType, newLimit, period)
      }

      // Clear cache
      this.cache.delete(`${userId}:${quotaType}:${period}`)
    } catch (error) {
      console.error('Failed to set user quota override:', error)
      throw new Error(`Failed to set user quota override: ${error}`)
    }
  }

  async clearQuotaCache(identifier?: string): Promise<void> {
    if (identifier) {
      // Clear cache for specific identifier
      for (const [key] of this.cache.keys()) {
        if (key.startsWith(`${identifier}:`)) {
          this.cache.delete(key)
          this.cacheExpiry.delete(key)
        }
      }
    } else {
      // Clear all cache
      this.cache.clear()
      this.cacheExpiry.clear()
    }
  }

  // Analytics and reporting
  async getTopViolators(
    quotaType: string,
    limit = 10
  ): Promise<
    Array<{
      identifier: string
      requests: number
      violations: number
      violationRate: number
      lastViolation: number
    }>
  > {
    try {
      const stmt = this.db.prepare(QUOTA_COUNTER_QUERIES.QUOTA_VIOLATIONS)
      const result = await stmt.bind(quotaType).all()

      const violations = result.results.map(row => ({
        identifier: row.ip_address || row.user_id || 'unknown',
        requests: parseInt(row.violation_count, 10),
        violations: parseInt(row.violation_count, 10),
        violationRate: 100, // Simplified calculation
        lastViolation: Date.now() - Math.random() * 86400000, // Mock data
      }))

      return violations.slice(0, limit)
    } catch (error) {
      console.error('Failed to get top violators:', error)
      return []
    }
  }

  async getSystemUtilization(): Promise<{
    totalQuotaTypes: number
    totalQuotaCounters: number
    averageUtilization: number
    topUtilizedTypes: Array<{
      quotaType: string
      utilization: number
      requests: number
    }>
  }> {
    try {
      const stmt = this.db.prepare(QUOTA_COUNTER_QUERIES.QUOTA_UTILIZATION)
      const result = await stmt.bind(Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60).all()

      const utilization = result.results.map(row => ({
        quotaType: row.quota_type,
        utilization: parseFloat(row.avg_utilization_percent),
        requests: parseInt(row.total_counters, 10),
      }))

      const totalRequests = utilization.reduce((sum, item) => sum + item.requests, 0)
      const averageUtilization =
        utilization.length > 0
          ? utilization.reduce((sum, item) => sum + item.utilization, 0) / utilization.length
          : 0

      return {
        totalQuotaTypes: utilization.length,
        totalQuotaCounters: totalRequests,
        averageUtilization: Math.round(averageUtilization * 100) / 100,
        topUtilizedTypes: utilization.sort((a, b) => b.utilization - a.utilization).slice(0, 10),
      }
    } catch (error) {
      console.error('Failed to get system utilization:', error)
      return {
        totalQuotaTypes: 0,
        totalQuotaCounters: 0,
        averageUtilization: 0,
        topUtilizedTypes: [],
      }
    }
  }

  // Private helper methods
  private getLimitConfig(quotaType: string, customPeriod?: QuotaPeriod): QuotaLimit | null {
    const defaultLimits = QuotaCounter.getDefaultLimits()
    const limit = defaultLimits.find(
      l => l.type === quotaType && (!customPeriod || l.period === customPeriod)
    )
    return limit || null
  }

  private async calculateActualLimit(
    identifier: string,
    limitConfig: QuotaLimit,
    customLimit?: number
  ): Promise<number> {
    // Use custom limit if provided
    if (customLimit) {
      return customLimit
    }

    // Check if it's an IP address (anonymous user)
    if (this.isIpAddress(identifier)) {
      return limitConfig.limit
    }

    // Get user tier and apply multiplier
    try {
      const user = await this.getUserById(identifier)
      if (!user) {
        return limitConfig.limit
      }

      const multipliers = limitConfig.user_tier_multipliers || {
        free: 1,
        pro: 10,
        enterprise: 100,
      }

      const multiplier = multipliers[user.subscription_tier] || 1
      return Math.round(limitConfig.limit * multiplier)
    } catch (error) {
      console.error('Failed to calculate actual limit:', error)
      return limitConfig.limit
    }
  }

  private async getQuotaCounter(
    identifier: string,
    quotaType: string,
    period: QuotaPeriod = 'hour'
  ): Promise<QuotaCounter | null> {
    try {
      const periodInfo = QuotaCounter.createPeriod(quotaType as any, period)

      let stmt: D1PreparedStatement
      let result: D1Result<any>

      if (this.isIpAddress(identifier)) {
        stmt = this.db.prepare(QUOTA_COUNTER_QUERIES.SELECT_BY_IP_AND_TYPE)
        result = await stmt
          .bind(identifier, quotaType, periodInfo.period_start, periodInfo.period_end)
          .first()
      } else {
        stmt = this.db.prepare(QUOTA_COUNTER_QUERIES.SELECT_BY_USER_AND_TYPE)
        result = await stmt
          .bind(identifier, quotaType, periodInfo.period_start, periodInfo.period_end)
          .first()
      }

      return result ? QuotaCounter.fromRow(result) : null
    } catch (error) {
      console.error('Failed to get quota counter:', error)
      return null
    }
  }

  private async createQuotaCounter(
    identifier: string,
    quotaType: string,
    limit: number,
    period: QuotaPeriod = 'hour'
  ): Promise<QuotaCounter> {
    try {
      const periodInfo = QuotaCounter.createPeriod(quotaType as any, period)

      const quotaCounter = this.isIpAddress(identifier)
        ? QuotaCounter.createForAnonymous(
            identifier,
            quotaType,
            period,
            limit,
            periodInfo.period_start
          )
        : QuotaCounter.createForUser(identifier, quotaType, period, limit, periodInfo.period_start)

      const stmt = this.db.prepare(QUOTA_COUNTER_QUERIES.INSERT)
      await stmt
        .bind(
          quotaCounter.id,
          quotaCounter.user_id,
          quotaCounter.quota_type,
          quotaCounter.period_start,
          quotaCounter.period_end,
          quotaCounter.used_count,
          quotaCounter.limit_count,
          quotaCounter.ip_address,
          quotaCounter.created_at,
          quotaCounter.updated_at
        )
        .run()

      return quotaCounter
    } catch (error) {
      console.error('Failed to create quota counter:', error)
      throw new Error(`Failed to create quota counter: ${error}`)
    }
  }

  private async updateQuotaCounter(quotaCounter: QuotaCounter): Promise<void> {
    try {
      const stmt = this.db.prepare(QUOTA_COUNTER_QUERIES.UPDATE)
      await stmt
        .bind(
          quotaCounter.used_count,
          quotaCounter.limit_count,
          quotaCounter.updated_at,
          quotaCounter.id
        )
        .run()
    } catch (error) {
      console.error('Failed to update quota counter:', error)
    }
  }

  private async updateCachedResult(
    cached: RateLimitCheck,
    amount: number
  ): Promise<RateLimitCheck | null> {
    const newRemaining = Math.max(0, cached.remaining - amount)

    if (newRemaining > 0) {
      return {
        ...cached,
        remaining: newRemaining,
      }
    }

    return null // Need to fetch fresh data
  }

  private async getUserById(userId: string): Promise<User | null> {
    try {
      const stmt = this.db.prepare(USER_QUERIES.SELECT_BY_ID)
      const result = await stmt.bind(userId).first()
      return result ? User.fromRow(result) : null
    } catch (error) {
      console.error('Failed to get user by ID:', error)
      return null
    }
  }

  private isIpAddress(identifier: string): boolean {
    // Simple IP address validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    return ipv4Regex.test(identifier) || ipv6Regex.test(identifier)
  }

  private async logRateLimitEvent(
    identifier: string,
    quotaType: string,
    limit: number,
    used: number
  ): Promise<void> {
    if (!this.auditEnabled) return

    try {
      const auditLog = AuditLog.create({
        user_id: this.isIpAddress(identifier) ? null : identifier,
        action: 'rate_limit_hit',
        resource_type: 'quota_counter',
        resource_id: null,
        new_values: {
          quota_type: quotaType,
          limit,
          used,
        },
        ipAddress: this.isIpAddress(identifier) ? identifier : undefined,
        success: false,
      })

      const stmt = this.db.prepare(AUDIT_LOG_QUERIES.INSERT)
      await stmt
        .bind(
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
          auditLog.created_at
        )
        .run()
    } catch (error) {
      console.error('Failed to log rate limit event:', error)
    }
  }

  private getDefaultLimits(): Record<string, QuotaLimit> {
    return {
      api_requests_hour: {
        type: 'api_requests' as any,
        period: 'hour' as any,
        limit: 100,
        windowMinutes: 60,
        appliesToAnonymous: true,
        appliesToAuthenticated: true,
        userTierMultipliers: { free: 1, pro: 5, enterprise: 20 },
      },
      api_requests_day: {
        type: 'api_requests' as any,
        period: 'day' as any,
        limit: 1000,
        windowMinutes: 1440,
        appliesToAnonymous: true,
        appliesToAuthenticated: true,
        userTierMultipliers: { free: 1, pro: 10, enterprise: 50 },
      },
      file_uploads_hour: {
        type: 'file_uploads' as any,
        period: 'hour' as any,
        limit: 10,
        windowMinutes: 60,
        appliesToAnonymous: true,
        appliesToAuthenticated: true,
        userTierMultipliers: { free: 1, pro: 5, enterprise: 20 },
      },
      file_uploads_day: {
        type: 'file_uploads' as any,
        period: 'day' as any,
        limit: 50,
        windowMinutes: 1440,
        appliesToAnonymous: true,
        appliesToAuthenticated: true,
        userTierMultipliers: { free: 1, pro: 10, enterprise: 100 },
      },
      execution_time_hour: {
        type: 'execution_time' as any,
        period: 'hour' as any,
        limit: 30000, // 30 seconds in milliseconds
        windowMinutes: 60,
        appliesToAnonymous: true,
        appliesToAuthenticated: true,
        userTierMultipliers: { free: 1, pro: 10, enterprise: 100 },
      },
      execution_time_day: {
        type: 'execution_time' as any,
        period: 'day' as any,
        limit: 300000, // 5 minutes in milliseconds
        windowMinutes: 1440,
        appliesToAnonymous: true,
        appliesToAuthenticated: true,
        userTierMultipliers: { free: 1, pro: 20, enterprise: 200 },
      },
      bandwidth_day: {
        type: 'bandwidth' as any,
        period: 'day' as any,
        limit: 100 * 1024 * 1024, // 100MB
        windowMinutes: 1440,
        appliesToAnonymous: true,
        appliesToAuthenticated: true,
        userTierMultipliers: { free: 1, pro: 10, enterprise: 100 },
      },
      storage_day: {
        type: 'storage' as any,
        period: 'day' as any,
        limit: 50 * 1024 * 1024, // 50MB
        windowMinutes: 1440,
        appliesToAnonymous: true,
        appliesToAuthenticated: true,
        userTierMultipliers: { free: 1, pro: 20, enterprise: 200 },
      },
      jobs_per_hour: {
        type: 'jobs_per_hour' as any,
        period: 'hour' as any,
        limit: 20,
        windowMinutes: 60,
        appliesToAnonymous: true,
        appliesToAuthenticated: true,
        userTierMultipliers: { free: 1, pro: 5, enterprise: 20 },
      },
      file_size_minute: {
        type: 'file_size' as any,
        period: 'minute' as any,
        limit: 10 * 1024 * 1024, // 10MB
        windowMinutes: 1,
        appliesToAnonymous: true,
        appliesToAuthenticated: true,
        userTierMultipliers: { free: 1, pro: 5, enterprise: 50 },
      },
    }
  }

  private isCacheExpired(key: string): boolean {
    const expiry = this.cacheExpiry.get(key)
    return !expiry || Date.now() > expiry
  }

  private async calculateRateLimit(options: RateLimitOptions): Promise<RateLimitCheck> {
    const { identifier, quotaType, amount = 1, bypassForUser, customLimit, customPeriod } = options

    // Bypass for specific users
    if (bypassForUser && identifier === bypassForUser) {
      return {
        allowed: true,
        remaining: Infinity,
        limit: Infinity,
        resetTime: Date.now() + 86400000, // 24 hours
      }
    }

    try {
      // Get rate limit configuration
      const limitConfig = this.getLimitConfig(quotaType, customPeriod)
      if (!limitConfig) {
        return {
          allowed: false,
          remaining: 0,
          limit: 0,
          resetTime: Date.now() + 3600000,
        }
      }

      // Calculate actual limit based on user tier
      const actualLimit = await this.calculateActualLimit(identifier, limitConfig, customLimit)

      // Get current quota counter
      let quotaCounter = await this.getQuotaCounter(identifier, quotaType, customPeriod)

      if (!quotaCounter) {
        // Create new quota counter
        quotaCounter = await this.createQuotaCounter(
          identifier,
          quotaType,
          actualLimit,
          customPeriod
        )
      }

      // Check if allowed
      const remaining = Math.max(0, actualLimit - quotaCounter.used_count)
      const allowed = remaining >= amount

      if (allowed) {
        // Update usage
        const updatedCounter = quotaCounter.increment(amount)
        await this.updateQuotaCounter(updatedCounter)

        const result = {
          allowed: true,
          remaining: remaining - amount,
          limit: actualLimit,
          resetTime: quotaCounter.period_end * 1000,
        }

        // Update local cache
        this.cache.set(`${identifier}:${quotaType}:${customPeriod || 'hour'}`, result)
        this.cacheExpiry.set(
          `${identifier}:${quotaType}:${customPeriod || 'hour'}`,
          Date.now() + 60000
        )

        return result
      } else {
        // Rate limit exceeded
        const result = {
          allowed: false,
          remaining: 0,
          limit: actualLimit,
          resetTime: quotaCounter.period_end * 1000,
          retryAfter: quotaCounter.period_end * 1000 - Date.now(),
        }

        // Log rate limit event
        if (this.auditEnabled) {
          await this.logRateLimitEvent(identifier, quotaType, actualLimit, quotaCounter.used_count)
        }

        // Cache negative result for shorter time
        this.cache.set(`${identifier}:${quotaType}:${customPeriod || 'hour'}`, result)
        this.cacheExpiry.set(
          `${identifier}:${quotaType}:${customPeriod || 'hour'}`,
          Date.now() + 30000
        )

        return result
      }
    } catch (error) {
      console.error('Failed to check rate limit:', error)
      // Fail open - allow the request
      return {
        allowed: true,
        remaining: 100,
        limit: 100,
        resetTime: Date.now() + 3600000,
      }
    }
  }

  // Advanced cache management
  async invalidateRateLimitCache(identifier?: string): Promise<void> {
    if (!this.cacheService || !this.enableAdvancedCaching) {
      return
    }

    try {
      if (identifier) {
        // Invalidate specific identifier cache
        await this.cacheService.invalidate({
          namespace: 'cache',
          tags: ['rate_limit', `identifier:${identifier}`],
        })

        // Clear local cache
        for (const [key] of this.cache) {
          if (key.startsWith(identifier)) {
            this.cache.delete(key)
            this.cacheExpiry.delete(key)
          }
        }
      } else {
        // Invalidate all rate limit cache
        await this.cacheService.invalidate({
          namespace: 'cache',
          tags: ['rate_limit'],
        })

        // Clear all local cache
        this.cache.clear()
        this.cacheExpiry.clear()
      }
    } catch (error) {
      console.error('Failed to invalidate rate limit cache:', error)
    }
  }

  async getRateLimitMetrics() {
    if (!this.cacheService) {
      return null
    }
    return this.cacheService.getMetrics()
  }

  async getRateLimitAnalytics() {
    if (!this.cacheService) {
      return null
    }
    return this.cacheService.getAnalytics()
  }
}
