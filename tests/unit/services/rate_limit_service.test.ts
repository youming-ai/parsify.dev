import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { RateLimitService } from '@/api/src/services/rate_limit_service'
import {
  createTestDatabase,
  createMockUser,
  createMockQuotaCounter,
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
vi.mock('@/api/src/models/quota_counter', () => ({
  QuotaCounter: {
    create: vi.fn(),
    createForAnonymous: vi.fn(),
    createForUser: vi.fn(),
    createPeriod: vi.fn(),
    getDefaultLimits: vi.fn(),
    fromRow: vi.fn(),
  },
  QUOTA_COUNTER_QUERIES: {
    INSERT: 'INSERT INTO quota_counters...',
    SELECT_BY_USER_AND_TYPE: 'SELECT * FROM quota_counters WHERE user_id = ?',
    SELECT_BY_IP_AND_TYPE: 'SELECT * FROM quota_counters WHERE ip_address = ?',
    UPDATE: 'UPDATE quota_counters SET...',
    QUOTA_VIOLATIONS: 'SELECT * FROM quota_violations...',
    QUOTA_UTILIZATION: 'SELECT * FROM quota_utilization...',
  },
}))

vi.mock('@/api/src/models/user', () => ({
  User: {
    create: vi.fn(),
    fromRow: vi.fn(),
  },
  USER_QUERIES: {
    SELECT_BY_ID: 'SELECT * FROM users WHERE id = ?',
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

describe('RateLimitService', () => {
  let rateLimitService: RateLimitService
  let mockDb: MockD1Database
  let mockKv: any
  let mockCacheService: any

  beforeEach(() => {
    setupTestEnvironment()

    mockDb = createTestDatabase({
      users: [createMockUser()],
      quota_counters: [createMockQuotaCounter()],
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

    rateLimitService = new RateLimitService({
      db: mockDb as any,
      kv: mockKv,
      auditEnabled: true,
      enableDistributedLimiting: true,
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
      const service = new RateLimitService({
        db: mockDb as any,
        kv: mockKv,
      })
      expect(service).toBeDefined()
    })

    it('should initialize with custom options', () => {
      const service = new RateLimitService({
        db: mockDb as any,
        kv: mockKv,
        auditEnabled: false,
        enableDistributedLimiting: false,
        enableAdvancedCaching: false,
        defaultLimits: {
          custom_quota: {
            type: 'custom_quota' as any,
            period: 'hour' as any,
            limit: 500,
            windowMinutes: 60,
            appliesToAnonymous: true,
            appliesToAuthenticated: true,
          },
        },
      })
      expect(service).toBeDefined()
    })
  })

  describe('checkRateLimit', () => {
    it('should allow request within limits', async () => {
      const options = {
        identifier: 'user-123',
        quotaType: 'api_requests',
        amount: 1,
      }

      const mockQuotaCounter = createMockQuotaCounter({
        user_id: options.identifier,
        quota_type: options.quotaType,
        used_count: 10,
        limit_count: 100,
      })

      const { QuotaCounter } = require('@/api/src/models/quota_counter')
      QuotaCounter.createPeriod.mockReturnValue({
        period_start: Math.floor(Date.now() / 1000) - 3600,
        period_end: Math.floor(Date.now() / 1000) + 3600,
      })
      QuotaCounter.fromRow.mockReturnValue(mockQuotaCounter)

      mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
        return await fetchFn()
      })

      // Mock database queries
      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockQuotaCounter),
        run: vi.fn().mockResolvedValue({ success: true }),
      }
      mockDb.prepare = vi.fn().mockReturnValue(mockStmt)

      // Mock user lookup for tier-based limits
      const mockUser = createMockUser({
        id: options.identifier,
        subscription_tier: 'free'
      })
      const { User } = require('@/api/src/models/user')
      User.fromRow.mockReturnValue(mockUser)

      const result = await rateLimitService.checkRateLimit(options)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(89) // 100 - 10 - 1
      expect(result.limit).toBe(100)
      expect(result.resetTime).toBeGreaterThan(Date.now())
    })

    it('should block request exceeding limits', async () => {
      const options = {
        identifier: 'user-123',
        quotaType: 'api_requests',
        amount: 10,
      }

      const mockQuotaCounter = createMockQuotaCounter({
        user_id: options.identifier,
        quota_type: options.quotaType,
        used_count: 95,
        limit_count: 100,
      })

      const { QuotaCounter } = require('@/api/src/models/quota_counter')
      QuotaCounter.createPeriod.mockReturnValue({
        period_start: Math.floor(Date.now() / 1000) - 3600,
        period_end: Math.floor(Date.now() / 1000) + 3600,
      })
      QuotaCounter.fromRow.mockReturnValue(mockQuotaCounter)

      mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
        return await fetchFn()
      })

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockQuotaCounter),
        run: vi.fn().mockResolvedValue({ success: true }),
      }
      mockDb.prepare = vi.fn().mockReturnValue(mockStmt)

      const mockUser = createMockUser({
        id: options.identifier,
        subscription_tier: 'free'
      })
      const { User } = require('@/api/src/models/user')
      User.fromRow.mockReturnValue(mockUser)

      const { AuditLog } = require('@/api/src/models/audit_log')
      const mockAuditLog = createMockAuditLog()
      AuditLog.create.mockReturnValue(mockAuditLog)

      const result = await rateLimitService.checkRateLimit(options)

      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.limit).toBe(100)
      expect(result.retryAfter).toBeDefined()
      expect(AuditLog.create).toHaveBeenCalled()
    })

    it('should bypass rate limiting for specified user', async () => {
      const options = {
        identifier: 'admin-user',
        quotaType: 'api_requests',
        amount: 1000,
        bypassForUser: 'admin-user',
      }

      const result = await rateLimitService.checkRateLimit(options)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(Infinity)
      expect(result.limit).toBe(Infinity)
    })

    it('should use local cache when advanced caching disabled', async () => {
      const serviceWithoutAdvancedCache = new RateLimitService({
        db: mockDb as any,
        kv: mockKv,
        enableAdvancedCaching: false,
      })

      const options = {
        identifier: 'user-123',
        quotaType: 'api_requests',
        amount: 1,
      }

      const mockQuotaCounter = createMockQuotaCounter({
        user_id: options.identifier,
        quota_type: options.quotaType,
        used_count: 10,
        limit_count: 100,
      })

      const { QuotaCounter } = require('@/api/src/models/quota_counter')
      QuotaCounter.createPeriod.mockReturnValue({
        period_start: Math.floor(Date.now() / 1000) - 3600,
        period_end: Math.floor(Date.now() / 1000) + 3600,
      })
      QuotaCounter.fromRow.mockReturnValue(mockQuotaCounter)

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockQuotaCounter),
        run: vi.fn().mockResolvedValue({ success: true }),
      }
      mockDb.prepare = vi.fn().mockReturnValue(mockStmt)

      const mockUser = createMockUser({
        id: options.identifier,
        subscription_tier: 'free'
      })
      const { User } = require('@/api/src/models/user')
      User.fromRow.mockReturnValue(mockUser)

      const result = await serviceWithoutAdvancedCache.checkRateLimit(options)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(89)
    })

    it('should apply custom limits', async () => {
      const options = {
        identifier: 'user-123',
        quotaType: 'api_requests',
        amount: 1,
        customLimit: 500,
      }

      const mockQuotaCounter = createMockQuotaCounter({
        user_id: options.identifier,
        quota_type: options.quotaType,
        used_count: 10,
        limit_count: 100, // Original limit
      })

      const { QuotaCounter } = require('@/api/src/models/quota_counter')
      QuotaCounter.createPeriod.mockReturnValue({
        period_start: Math.floor(Date.now() / 1000) - 3600,
        period_end: Math.floor(Date.now() / 1000) + 3600,
      })
      QuotaCounter.fromRow.mockReturnValue(mockQuotaCounter)

      mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
        return await fetchFn()
      })

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockQuotaCounter),
        run: vi.fn().mockResolvedValue({ success: true }),
      }
      mockDb.prepare = vi.fn().mockReturnValue(mockStmt)

      const mockUser = createMockUser({
        id: options.identifier,
        subscription_tier: 'free'
      })
      const { User } = require('@/api/src/models/user')
      User.fromRow.mockReturnValue(mockUser)

      const result = await rateLimitService.checkRateLimit(options)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(489) // 500 - 10 - 1
      expect(result.limit).toBe(500) // Custom limit
    })

    it('should handle anonymous users (IP addresses)', async () => {
      const options = {
        identifier: '192.168.1.1',
        quotaType: 'api_requests',
        amount: 1,
      }

      const mockQuotaCounter = createMockQuotaCounter({
        ip_address: options.identifier,
        quota_type: options.quotaType,
        used_count: 5,
        limit_count: 50, // Lower limit for anonymous users
      })

      const { QuotaCounter } = require('@/api/src/models/quota_counter')
      QuotaCounter.createPeriod.mockReturnValue({
        period_start: Math.floor(Date.now() / 1000) - 3600,
        period_end: Math.floor(Date.now() / 1000) + 3600,
      })
      QuotaCounter.fromRow.mockReturnValue(mockQuotaCounter)

      mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
        return await fetchFn()
      })

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockQuotaCounter),
        run: vi.fn().mockResolvedValue({ success: true }),
      }
      mockDb.prepare = vi.fn().mockReturnValue(mockStmt)

      const result = await rateLimitService.checkRateLimit(options)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(44) // 50 - 5 - 1
      expect(result.limit).toBe(50)
    })

    it('should handle database errors gracefully', async () => {
      const options = {
        identifier: 'user-123',
        quotaType: 'api_requests',
        amount: 1,
      }

      const { QuotaCounter } = require('@/api/src/models/quota_counter')
      QuotaCounter.createPeriod.mockReturnValue({
        period_start: Math.floor(Date.now() / 1000) - 3600,
        period_end: Math.floor(Date.now() / 1000) + 3600,
      })

      mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
        return await fetchFn()
      })

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockRejectedValue(new Error('Database error')),
      }
      mockDb.prepare = vi.fn().mockReturnValue(mockStmt)

      const result = await rateLimitService.checkRateLimit(options)

      // Should fail open
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(100)
      expect(result.limit).toBe(100)
    })
  })

  describe('consumeQuota', () => {
    it('should consume quota successfully', async () => {
      const options = {
        identifier: 'user-123',
        quotaType: 'api_requests',
        amount: 1,
      }

      const mockQuotaCounter = createMockQuotaCounter({
        user_id: options.identifier,
        quota_type: options.quotaType,
        used_count: 10,
        limit_count: 100,
      })

      const { QuotaCounter } = require('@/api/src/models/quota_counter')
      QuotaCounter.createPeriod.mockReturnValue({
        period_start: Math.floor(Date.now() / 1000) - 3600,
        period_end: Math.floor(Date.now() / 1000) + 3600,
      })
      QuotaCounter.fromRow.mockReturnValue(mockQuotaCounter)

      mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
        return await fetchFn()
      })

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockQuotaCounter),
        run: vi.fn().mockResolvedValue({ success: true }),
      }
      mockDb.prepare = vi.fn().mockReturnValue(mockStmt)

      const mockUser = createMockUser({
        id: options.identifier,
        subscription_tier: 'free'
      })
      const { User } = require('@/api/src/models/user')
      User.fromRow.mockReturnValue(mockUser)

      const result = await rateLimitService.consumeQuota(options)

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(89)
    })

    it('should return error when quota exceeded', async () => {
      const options = {
        identifier: 'user-123',
        quotaType: 'api_requests',
        amount: 10,
      }

      const mockQuotaCounter = createMockQuotaCounter({
        user_id: options.identifier,
        quota_type: options.quotaType,
        used_count: 95,
        limit_count: 100,
      })

      const { QuotaCounter } = require('@/api/src/models/quota_counter')
      QuotaCounter.createPeriod.mockReturnValue({
        period_start: Math.floor(Date.now() / 1000) - 3600,
        period_end: Math.floor(Date.now() / 1000) + 3600,
      })
      QuotaCounter.fromRow.mockReturnValue(mockQuotaCounter)

      mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
        return await fetchFn()
      })

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockQuotaCounter),
        run: vi.fn().mockResolvedValue({ success: true }),
      }
      mockDb.prepare = vi.fn().mockReturnValue(mockStmt)

      const mockUser = createMockUser({
        id: options.identifier,
        subscription_tier: 'free'
      })
      const { User } = require('@/api/src/models/user')
      User.fromRow.mockReturnValue(mockUser)

      const { AuditLog } = require('@/api/src/models/audit_log')
      const mockAuditLog = createMockAuditLog()
      AuditLog.create.mockReturnValue(mockAuditLog)

      const result = await rateLimitService.consumeQuota(options)

      expect(result.allowed).toBe(false)
      expect(result.error).toBe('Rate limit exceeded')
    })
  })

  describe('resetQuota', () => {
    it('should reset quota successfully', async () => {
      const identifier = 'user-123'
      const quotaType = 'api_requests'

      const mockQuotaCounter = createMockQuotaCounter({
        user_id: identifier,
        quota_type: quotaType,
        used_count: 50,
        limit_count: 100,
      })

      const { QuotaCounter } = require('@/api/src/models/quota_counter')
      QuotaCounter.createPeriod.mockReturnValue({
        period_start: Math.floor(Date.now() / 1000) - 3600,
        period_end: Math.floor(Date.now() / 1000) + 3600,
      })
      QuotaCounter.fromRow.mockReturnValue(mockQuotaCounter)

      const mockResetCounter = {
        ...mockQuotaCounter,
        reset: vi.fn().mockReturnValue({
          ...mockQuotaCounter,
          used_count: 0,
        }),
      }
      QuotaCounter.fromRow.mockReturnValue(mockResetCounter)

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockQuotaCounter),
        run: vi.fn().mockResolvedValue({ success: true }),
      }
      mockDb.prepare = vi.fn().mockReturnValue(mockStmt)

      await rateLimitService.resetQuota(identifier, quotaType)

      expect(mockResetCounter.reset).toHaveBeenCalled()
    })

    it('should handle non-existent quota counter', async () => {
      const identifier = 'user-123'
      const quotaType = 'api_requests'

      const { QuotaCounter } = require('@/api/src/models/quota_counter')
      QuotaCounter.createPeriod.mockReturnValue({
        period_start: Math.floor(Date.now() / 1000) - 3600,
        period_end: Math.floor(Date.now() / 1000) + 3600,
      })

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null), // No quota counter found
      }
      mockDb.prepare = vi.fn().mockReturnValue(mockStmt)

      // Should not throw error
      await expect(rateLimitService.resetQuota(identifier, quotaType))
        .resolves.toBeUndefined()
    })
  })

  describe('getQuotaUsage', () => {
    it('should return quota usage for existing counter', async () => {
      const identifier = 'user-123'
      const quotaType = 'api_requests'

      const mockQuotaCounter = createMockQuotaCounter({
        user_id: identifier,
        quota_type: quotaType,
        used_count: 25,
        limit_count: 100,
      })

      const { QuotaCounter } = require('@/api/src/models/quota_counter')
      QuotaCounter.fromRow.mockReturnValue(mockQuotaCounter)

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockQuotaCounter),
      }
      mockDb.prepare = vi.fn().mockReturnValue(mockStmt)

      const result = await rateLimitService.getQuotaUsage(identifier, quotaType)

      expect(result.used).toBe(25)
      expect(result.limit).toBe(100)
      expect(result.remaining).toBe(75)
      expect(result.resetTime).toBeGreaterThan(Date.now())
    })

    it('should return default values for non-existent counter', async () => {
      const identifier = 'user-123'
      const quotaType = 'api_requests'

      const { QuotaCounter } = require('@/api/src/models/quota_counter')
      QuotaCounter.getDefaultLimits.mockReturnValue([
        {
          type: 'api_requests',
          period: 'hour',
          limit: 100,
          windowMinutes: 60,
          appliesToAnonymous: true,
          appliesToAuthenticated: true,
        },
      ])

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null), // No quota counter found
      }
      mockDb.prepare = vi.fn().mockReturnValue(mockStmt)

      const mockUser = createMockUser({
        id: identifier,
        subscription_tier: 'free'
      })
      const { User } = require('@/api/src/models/user')
      User.fromRow.mockReturnValue(mockUser)

      const result = await rateLimitService.getQuotaUsage(identifier, quotaType)

      expect(result.used).toBe(0)
      expect(result.limit).toBe(100)
      expect(result.remaining).toBe(100)
    })
  })

  describe('getQuotaStats', () => {
    it('should return quota statistics', async () => {
      const quotaType = 'api_requests'

      const mockStats = {
        total_requests: 1000,
        successful_requests: 950,
        blocked_requests: 50,
        average_usage: 45,
        peak_usage: 95,
        utilization_rate: 0.45,
      }

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockStats),
      }
      mockDb.prepare = vi.fn().mockReturnValue(mockStmt)

      const result = await rateLimitService.getQuotaStats(quotaType)

      expect(result.quotaType).toBe(quotaType)
      expect(result.totalRequests).toBe(1000)
      expect(result.successfulRequests).toBe(950)
      expect(result.blockedRequests).toBe(50)
      expect(result.averageUsage).toBe(45)
      expect(result.peakUsage).toBe(95)
      expect(result.utilizationRate).toBe(0.45)
    })

    it('should return empty stats when no data', async () => {
      const quotaType = 'nonexistent_quota'

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      }
      mockDb.prepare = vi.fn().mockReturnValue(mockStmt)

      const result = await rateLimitService.getQuotaStats(quotaType)

      expect(result.quotaType).toBe(quotaType)
      expect(result.totalRequests).toBe(0)
      expect(result.successfulRequests).toBe(0)
      expect(result.blockedRequests).toBe(0)
      expect(result.averageUsage).toBe(0)
      expect(result.peakUsage).toBe(0)
      expect(result.utilizationRate).toBe(0)
    })
  })

  describe('getUserQuotas', () => {
    it('should return all quota types for user', async () => {
      const userId = 'user-123'

      // Mock quota usage for different types
      const mockQuotaCounters = [
        createMockQuotaCounter({
          user_id: userId,
          quota_type: 'api_requests',
          used_count: 10,
          limit_count: 100,
        }),
        createMockQuotaCounter({
          user_id: userId,
          quota_type: 'file_uploads',
          used_count: 2,
          limit_count: 10,
        }),
      ]

      const { QuotaCounter } = require('@/api/src/models/quota_counter')
      QuotaCounter.fromRow
        .mockReturnValueOnce(mockQuotaCounters[0])
        .mockReturnValueOnce(mockQuotaCounters[1])
        .mockReturnValue(null) // For other quota types

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn(),
      }
      mockDb.prepare = vi.fn().mockReturnValue(mockStmt)
      mockStmt.first
        .mockResolvedValueOnce(mockQuotaCounters[0])
        .mockResolvedValueOnce(mockQuotaCounters[1])
        .mockResolvedValue(null)

      const result = await rateLimitService.getUserQuotas(userId)

      expect(result).toHaveProperty('api_requests')
      expect(result).toHaveProperty('file_uploads')
      expect(result).toHaveProperty('api_requests_daily')
      expect(result).toHaveProperty('execution_time_daily')
      expect(result.api_requests.used).toBe(10)
      expect(result.api_requests.limit).toBe(100)
      expect(result.file_uploads.used).toBe(2)
      expect(result.file_uploads.limit).toBe(10)
    })

    it('should handle errors gracefully', async () => {
      const userId = 'user-123'

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockRejectedValue(new Error('Database error')),
      }
      mockDb.prepare = vi.fn().mockReturnValue(mockStmt)

      const result = await rateLimitService.getUserQuotas(userId)

      // Should return default values for all quota types
      expect(result).toHaveProperty('api_requests')
      expect(result).toHaveProperty('file_uploads')
      expect(result.api_requests.used).toBe(0)
      expect(result.api_requests.limit).toBe(100)
    })
  })

  describe('setUserQuotaOverride', () => {
    it('should set custom quota for user', async () => {
      const userId = 'user-123'
      const quotaType = 'api_requests'
      const newLimit = 500

      const existingQuota = createMockQuotaCounter({
        user_id: userId,
        quota_type: quotaType,
        used_count: 10,
        limit_count: 100,
      })

      const { QuotaCounter } = require('@/api/src/models/quota_counter')
      QuotaCounter.fromRow.mockReturnValue(existingQuota)

      const updatedQuota = {
        ...existingQuota,
        setLimit: vi.fn().mockReturnValue({
          ...existingQuota,
          limit_count: newLimit,
        }),
      }
      QuotaCounter.fromRow.mockReturnValue(updatedQuota)

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(existingQuota),
        run: vi.fn().mockResolvedValue({ success: true }),
      }
      mockDb.prepare = vi.fn().mockReturnValue(mockStmt)

      await rateLimitService.setUserQuotaOverride(userId, quotaType, newLimit)

      expect(updatedQuota.setLimit).toHaveBeenCalledWith(newLimit)
    })

    it('should create new quota counter if none exists', async () => {
      const userId = 'user-123'
      const quotaType = 'api_requests'
      const newLimit = 500

      const { QuotaCounter } = require('@/api/src/models/quota_counter')
      QuotaCounter.fromRow.mockReturnValue(null) // No existing quota

      const newQuota = createMockQuotaCounter({
        user_id: userId,
        quota_type: quotaType,
        limit_count: newLimit,
      })
      QuotaCounter.createForUser.mockReturnValue(newQuota)

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
        run: vi.fn().mockResolvedValue({ success: true }),
      }
      mockDb.prepare = vi.fn().mockReturnValue(mockStmt)

      await rateLimitService.setUserQuotaOverride(userId, quotaType, newLimit)

      expect(QuotaCounter.createForUser).toHaveBeenCalledWith(
        userId,
        quotaType,
        'hour',
        newLimit,
        expect.any(Number)
      )
    })
  })

  describe('Analytics', () => {
    describe('getTopViolators', () => {
      it('should return top violators', async () => {
        const quotaType = 'api_requests'

        const mockViolations = [
          {
            ip_address: '192.168.1.100',
            violation_count: 50,
          },
          {
            user_id: 'user-456',
            violation_count: 25,
          },
        ]

        const mockStmt = {
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue({ results: mockViolations }),
        }
        mockDb.prepare = vi.fn().mockReturnValue(mockStmt)

        const result = await rateLimitService.getTopViolators(quotaType, 5)

        expect(result).toHaveLength(2)
        expect(result[0].identifier).toBe('192.168.1.100')
        expect(result[0].requests).toBe(50)
        expect(result[1].identifier).toBe('user-456')
        expect(result[1].requests).toBe(25)
      })

      it('should handle empty results', async () => {
        const quotaType = 'unused_quota'

        const mockStmt = {
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue({ results: [] }),
        }
        mockDb.prepare = vi.fn().mockReturnValue(mockStmt)

        const result = await rateLimitService.getTopViolators(quotaType)

        expect(result).toHaveLength(0)
      })
    })

    describe('getSystemUtilization', () => {
      it('should return system utilization stats', async () => {
        const mockUtilization = [
          {
            quota_type: 'api_requests',
            avg_utilization_percent: 45.5,
            total_counters: 1000,
          },
          {
            quota_type: 'file_uploads',
            avg_utilization_percent: 25.0,
            total_counters: 500,
          },
        ]

        const mockStmt = {
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue({ results: mockUtilization }),
        }
        mockDb.prepare = vi.fn().mockReturnValue(mockStmt)

        const result = await rateLimitService.getSystemUtilization()

        expect(result.totalQuotaTypes).toBe(2)
        expect(result.totalQuotaCounters).toBe(1500)
        expect(result.averageUtilization).toBe(35.25) // (45.5 + 25.0) / 2
        expect(result.topUtilizedTypes).toHaveLength(2)
        expect(result.topUtilizedTypes[0].quotaType).toBe('api_requests')
        expect(result.topUtilizedTypes[0].utilization).toBe(45.5)
      })

      it('should handle empty utilization data', async () => {
        const mockStmt = {
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue({ results: [] }),
        }
        mockDb.prepare = vi.fn().mockReturnValue(mockStmt)

        const result = await rateLimitService.getSystemUtilization()

        expect(result.totalQuotaTypes).toBe(0)
        expect(result.totalQuotaCounters).toBe(0)
        expect(result.averageUtilization).toBe(0)
        expect(result.topUtilizedTypes).toHaveLength(0)
      })
    })
  })

  describe('Cache Management', () => {
    describe('clearQuotaCache', () => {
      it('should clear cache for specific identifier', async () => {
        const identifier = 'user-123'

        // Add some cache entries
        ;(rateLimitService as any).cache.set(`${identifier}:api_requests:hour`, {
          allowed: true,
          remaining: 50,
          limit: 100,
        })
        ;(rateLimitService as any).cache.set(`${identifier}:file_uploads:hour`, {
          allowed: true,
          remaining: 8,
          limit: 10,
        })
        ;(rateLimitService as any).cache.set('other-user:api_requests:hour', {
          allowed: false,
          remaining: 0,
          limit: 100,
        })

        await rateLimitService.clearQuotaCache(identifier)

        expect((rateLimitService as any).cache.size).toBe(1)
        expect((rateLimitService as any).cache.has('other-user:api_requests:hour')).toBe(true)
      })

      it('should clear all cache', async () => {
        // Add some cache entries
        ;(rateLimitService as any).cache.set('user-1:api_requests:hour', {})
        ;(rateLimitService as any).cache.set('user-2:api_requests:hour', {})

        await rateLimitService.clearQuotaCache()

        expect((rateLimitService as any).cache.size).toBe(0)
      })
    })

    describe('invalidateRateLimitCache', () => {
      it('should invalidate cache for specific identifier', async () => {
        const identifier = 'user-123'

        await rateLimitService.invalidateRateLimitCache(identifier)

        expect(mockCacheService.invalidate).toHaveBeenCalledWith({
          namespace: 'cache',
          tags: ['rate_limit', `identifier:${identifier}`],
        })
      })

      it('should invalidate all rate limit cache', async () => {
        await rateLimitService.invalidateRateLimitCache()

        expect(mockCacheService.invalidate).toHaveBeenCalledWith({
          namespace: 'cache',
          tags: ['rate_limit'],
        })
      })
    })

    describe('getRateLimitMetrics', () => {
      it('should return cache metrics', () => {
        const mockMetrics = {
          hits: 1000,
          misses: 100,
          hitRate: 0.91,
        }

        mockCacheService.getMetrics.mockReturnValue(mockMetrics)

        const result = rateLimitService.getRateLimitMetrics()

        expect(result).toEqual(mockMetrics)
      })

      it('should return null when cache service not available', () => {
        const serviceWithoutCache = new RateLimitService({
          db: mockDb as any,
          kv: mockKv,
          enableAdvancedCaching: false,
        })

        const result = serviceWithoutCache.getRateLimitMetrics()

        expect(result).toBeNull()
      })
    })
  })

  describe('Helper Methods', () => {
    describe('isIpAddress', () => {
      it('should identify IPv4 addresses', () => {
        expect((rateLimitService as any).isIpAddress('192.168.1.1')).toBe(true)
        expect((rateLimitService as any).isIpAddress('10.0.0.1')).toBe(true)
        expect((rateLimitService as any).isIpAddress('127.0.0.1')).toBe(true)
      })

      it('should identify IPv6 addresses', () => {
        expect((rateLimitService as any).isIpAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true)
        expect((rateLimitService as any).isIpAddress('::1')).toBe(true)
      })

      it('should reject non-IP addresses', () => {
        expect((rateLimitService as any).isIpAddress('user-123')).toBe(false)
        expect((rateLimitService as any).isIpAddress('not-an-ip')).toBe(false)
        expect((rateLimitService as any).isIpAddress('999.999.999.999')).toBe(false)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const options = {
        identifier: 'user-123',
        quotaType: 'api_requests',
        amount: 1,
      }

      const { QuotaCounter } = require('@/api/src/models/quota_counter')
      QuotaCounter.createPeriod.mockReturnValue({
        period_start: Math.floor(Date.now() / 1000) - 3600,
        period_end: Math.floor(Date.now() / 1000) + 3600,
      })

      mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
        return await fetchFn()
      })

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockRejectedValue(new Error('Connection failed')),
      }
      mockDb.prepare = vi.fn().mockReturnValue(mockStmt)

      const result = await rateLimitService.checkRateLimit(options)

      // Should fail open
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(100)
    })

    it('should handle malformed quota counter data', async () => {
      const identifier = 'user-123'
      const quotaType = 'api_requests'

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ invalid: 'data' }),
      }
      mockDb.prepare = vi.fn().mockReturnValue(mockStmt)

      const { QuotaCounter } = require('@/api/src/models/quota_counter')
      QuotaCounter.fromRow.mockImplementation(() => {
        throw new Error('Invalid quota counter data')
      })

      const result = await rateLimitService.getQuotaUsage(identifier, quotaType)

      // Should handle gracefully
      expect(result).toBeDefined()
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complete rate limiting workflow', async () => {
      const userId = 'user-123'
      const quotaType = 'api_requests'

      // 1. Initial check - should be allowed
      const options1 = { identifier: userId, quotaType, amount: 10 }
      const mockQuotaCounter1 = createMockQuotaCounter({
        user_id: userId,
        quota_type: quotaType,
        used_count: 0,
        limit_count: 100,
      })

      const { QuotaCounter } = require('@/api/src/models/quota_counter')
      QuotaCounter.createPeriod.mockReturnValue({
        period_start: Math.floor(Date.now() / 1000) - 3600,
        period_end: Math.floor(Date.now() / 1000) + 3600,
      })
      QuotaCounter.fromRow.mockReturnValue(mockQuotaCounter1)

      mockCacheService.getOrSet.mockImplementation(async (key, fetchFn, options) => {
        return await fetchFn()
      })

      const mockStmt = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockQuotaCounter1),
        run: vi.fn().mockResolvedValue({ success: true }),
      }
      mockDb.prepare = vi.fn().mockReturnValue(mockStmt)

      const mockUser = createMockUser({
        id: userId,
        subscription_tier: 'pro' // Higher tier
      })
      const { User } = require('@/api/src/models/user')
      User.fromRow.mockReturnValue(mockUser)

      const result1 = await rateLimitService.checkRateLimit(options1)
      expect(result1.allowed).toBe(true)
      expect(result1.remaining).toBe(490) // Pro tier gets 5x multiplier (500 - 10)

      // 2. Second check - should consume more
      const options2 = { identifier: userId, quotaType, amount: 20 }
      const mockQuotaCounter2 = createMockQuotaCounter({
        user_id: userId,
        quota_type: quotaType,
        used_count: 10,
        limit_count: 500,
      })

      QuotaCounter.fromRow.mockReturnValue(mockQuotaCounter2)
      mockStmt.first.mockResolvedValue(mockQuotaCounter2)

      const result2 = await rateLimitService.checkRateLimit(options2)
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(470) // 500 - 10 - 20

      // 3. Check usage stats
      QuotaCounter.fromRow.mockReturnValue(mockQuotaCounter2)
      const usage = await rateLimitService.getQuotaUsage(userId, quotaType)
      expect(usage.used).toBe(10) // From original counter
      expect(usage.limit).toBe(500)
      expect(usage.remaining).toBe(490)

      // 4. Reset quota
      const mockResetCounter = {
        ...mockQuotaCounter2,
        reset: vi.fn().mockReturnValue({
          ...mockQuotaCounter2,
          used_count: 0,
        }),
      }
      QuotaCounter.fromRow.mockReturnValue(mockResetCounter)

      await rateLimitService.resetQuota(userId, quotaType)
      expect(mockResetCounter.reset).toHaveBeenCalled()

      // 5. Check after reset
      const result3 = await rateLimitService.checkRateLimit({ identifier: userId, quotaType, amount: 1 })
      expect(result3.allowed).toBe(true)
    })
  })
})
