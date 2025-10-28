import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthService } from '@/api/src/services/auth_service'
import {
  cleanupTestEnvironment,
  createMockAuditLog,
  createMockAuthIdentity,
  createMockUser,
  createTestDatabase,
  type MockD1Database,
  setupTestEnvironment,
} from '../models/database.mock'

// Mock fetch for OAuth calls
global.fetch = vi.fn()

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
vi.mock('@/api/src/models/user', () => ({
  User: {
    create: vi.fn(),
    fromRow: vi.fn(),
  },
  UserSchema: {
    parse: vi.fn(),
    safeParse: vi.fn(),
  },
  USER_QUERIES: {
    INSERT: 'INSERT INTO users...',
    SELECT_BY_ID: 'SELECT * FROM users WHERE id = ?',
    SELECT_BY_EMAIL: 'SELECT * FROM users WHERE email = ?',
    UPDATE: 'UPDATE users SET...',
    DELETE: 'DELETE FROM users WHERE id = ?',
  },
}))

vi.mock('@/api/src/models/auth_identity', () => ({
  AuthIdentity: {
    create: vi.fn(),
    fromRow: vi.fn(),
  },
  AuthIdentitySchema: {
    parse: vi.fn(),
  },
  AUTH_IDENTITY_QUERIES: {
    INSERT: 'INSERT INTO auth_identities...',
    SELECT_BY_PROVIDER_AND_UID:
      'SELECT * FROM auth_identities WHERE provider = ? AND provider_uid = ?',
    UPDATE: 'UPDATE auth_identities SET...',
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

vi.mock('@/api/src/models/quota_counter', () => ({
  QuotaCounter: {
    create: vi.fn(),
    createForAnonymous: vi.fn(),
    createPeriod: vi.fn(),
    fromRow: vi.fn(),
  },
  QUOTA_COUNTER_QUERIES: {
    INSERT: 'INSERT INTO quota_counters...',
    SELECT_BY_USER_AND_TYPE: 'SELECT * FROM quota_counters WHERE quota_type = ?',
    UPDATE_USAGE: 'UPDATE quota_counters SET...',
  },
}))

describe('AuthService', () => {
  let authService: AuthService
  let mockDb: MockD1Database
  let mockKv: any
  let mockDbClient: any
  let mockCacheService: any

  beforeEach(() => {
    setupTestEnvironment()

    mockDb = createTestDatabase({
      users: [createMockUser()],
      auth_identities: [createMockAuthIdentity()],
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

    // Create a mock database client
    mockDbClient = {
      query: vi.fn(),
      queryFirst: vi.fn(),
      execute: vi.fn(),
      enhancedTransaction: vi.fn(),
    }

    const { createDatabaseClient } = require('@/api/src/database')
    createDatabaseClient.mockReturnValue(mockDbClient)

    authService = new AuthService({
      db: mockDb as any,
      kv: mockKv,
      jwtSecret: 'test-secret',
      auditEnabled: true,
      sessionTimeoutMinutes: 30,
      cloudflareService: mockCloudflareService,
      enableAdvancedCaching: true,
    })

    // Configure OAuth providers for testing
    authService.configureProviders({
      google: {
        clientId: 'google-client-id',
        clientSecret: 'google-client-secret',
        redirectUri: 'http://localhost:3000/auth/google/callback',
        scopes: ['openid', 'email', 'profile'],
      },
      github: {
        clientId: 'github-client-id',
        clientSecret: 'github-client-secret',
        redirectUri: 'http://localhost:3000/auth/github/callback',
        scopes: ['user:email'],
      },
    })
  })

  afterEach(() => {
    cleanupTestEnvironment()
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      const service = new AuthService({
        db: mockDb as any,
        kv: mockKv,
        jwtSecret: 'test-secret',
      })
      expect(service).toBeDefined()
    })

    it('should initialize with custom options', () => {
      const service = new AuthService({
        db: mockDb as any,
        kv: mockKv,
        jwtSecret: 'test-secret',
        auditEnabled: false,
        sessionTimeoutMinutes: 60,
        enableAdvancedCaching: false,
      })
      expect(service).toBeDefined()
    })
  })

  describe('configureProviders', () => {
    it('should configure OAuth providers', () => {
      const providers = {
        google: {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          redirectUri: 'http://localhost:3000/callback',
          scopes: ['email'],
        },
      }

      authService.configureProviders(providers)
      expect(authService).toBeDefined()
    })
  })

  describe('Session Management', () => {
    describe('createSession', () => {
      it('should create a session for authenticated user', async () => {
        const userId = 'user-123'
        const ipAddress = '127.0.0.1'
        const userAgent = 'test-agent'

        mockCacheService.set.mockResolvedValue(undefined)

        const sessionId = await authService.createSession(userId, ipAddress, userAgent)

        expect(sessionId).toBeDefined()
        expect(typeof sessionId).toBe('string')
        expect(mockCacheService.set).toHaveBeenCalledWith(
          expect.stringContaining('session:'),
          expect.objectContaining({
            sessionId,
            userId,
            ipAddress,
            userAgent,
          }),
          expect.objectContaining({
            namespace: 'sessions',
            ttl: 1800, // 30 minutes
          })
        )
      })

      it('should create a session for anonymous user', async () => {
        const ipAddress = '127.0.0.1'
        const userAgent = 'test-agent'

        mockCacheService.set.mockResolvedValue(undefined)

        const sessionId = await authService.createSession(undefined, ipAddress, userAgent)

        expect(sessionId).toBeDefined()
        expect(mockCacheService.set).toHaveBeenCalledWith(
          expect.stringContaining('session:'),
          expect.objectContaining({
            sessionId,
            userId: undefined,
            ipAddress,
            userAgent,
          }),
          expect.objectContaining({
            namespace: 'sessions',
          })
        )
      })
    })

    describe('getSession', () => {
      it('should retrieve existing session', async () => {
        const sessionId = 'session-123'
        const sessionData = {
          sessionId,
          userId: 'user-123',
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          createdAt: Math.floor(Date.now() / 1000),
          lastAccessAt: Math.floor(Date.now() / 1000),
        }

        mockCacheService.get.mockResolvedValue(sessionData)
        mockCacheService.set.mockResolvedValue(undefined)

        const result = await authService.getSession(sessionId)

        expect(result).toEqual(sessionData)
        expect(mockCacheService.get).toHaveBeenCalledWith(`session:${sessionId}`, {
          namespace: 'sessions',
        })
      })

      it('should return null for non-existent session', async () => {
        const sessionId = 'nonexistent-session'
        mockCacheService.get.mockResolvedValue(null)

        const result = await authService.getSession(sessionId)

        expect(result).toBeNull()
      })

      it('should handle expired sessions', async () => {
        const sessionId = 'expired-session'
        const expiredSession = {
          sessionId,
          userId: 'user-123',
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          createdAt: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
          lastAccessAt: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        }

        mockCacheService.get.mockResolvedValue(expiredSession)
        mockCacheService.delete.mockResolvedValue(undefined)

        const result = await authService.getSession(sessionId)

        expect(result).toBeNull()
        expect(mockCacheService.delete).toHaveBeenCalledWith(`session:${sessionId}`, {
          namespace: 'sessions',
        })
      })
    })

    describe('updateSession', () => {
      it('should update existing session', async () => {
        const sessionId = 'session-123'
        const existingSession = {
          sessionId,
          userId: 'user-123',
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          createdAt: Math.floor(Date.now() / 1000),
          lastAccessAt: Math.floor(Date.now() / 1000),
        }

        const updates = { userAgent: 'updated-agent' }
        const updatedSession = { ...existingSession, ...updates }

        mockCacheService.get.mockResolvedValue(existingSession)
        mockCacheService.set.mockResolvedValue(undefined)

        const result = await authService.updateSession(sessionId, updates)

        expect(result).toBe(true)
        expect(mockCacheService.set).toHaveBeenCalledWith(
          `session:${sessionId}`,
          updatedSession,
          expect.objectContaining({
            namespace: 'sessions',
          })
        )
      })

      it('should return false for non-existent session', async () => {
        const sessionId = 'nonexistent-session'
        mockCacheService.get.mockResolvedValue(null)

        const result = await authService.updateSession(sessionId, {
          userAgent: 'updated',
        })

        expect(result).toBe(false)
      })
    })

    describe('deleteSession', () => {
      it('should delete existing session', async () => {
        const sessionId = 'session-123'
        mockCacheService.delete.mockResolvedValue(undefined)

        await authService.deleteSession(sessionId)

        expect(mockCacheService.delete).toHaveBeenCalledWith(`session:${sessionId}`, {
          namespace: 'sessions',
        })
      })
    })
  })

  describe('Token Management', () => {
    describe('generateToken', () => {
      it('should generate a valid token', async () => {
        const sessionId = 'session-123'
        const userId = 'user-123'
        const tier = 'pro'

        // Mock the sign method
        const originalSign = authService.sign
        authService.sign = vi.fn().mockReturnValue('mock-signature')

        const token = authService.generateToken(sessionId, userId, tier)

        expect(token).toBeDefined()
        expect(typeof token).toBe('string')
        expect(token.split('.')).toHaveLength(3) // header.payload.signature

        authService.sign = originalSign
      })
    })

    describe('verifyToken', () => {
      it('should verify a valid token', async () => {
        const sessionId = 'session-123'
        const userId = 'user-123'
        const ipAddress = '127.0.0.1'
        const sessionData = {
          sessionId,
          userId,
          ipAddress,
          userAgent: 'test-agent',
          createdAt: Math.floor(Date.now() / 1000),
          lastAccessAt: Math.floor(Date.now() / 1000),
        }

        // Create a valid token structure
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        const payload = btoa(
          JSON.stringify({
            sessionId,
            userId,
            ipAddress,
            tier: 'pro',
            exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            iat: Math.floor(Date.now() / 1000),
          })
        )
        const signature = 'mock-signature'
        const token = `${header}.${payload}.${signature}`

        mockCacheService.get.mockResolvedValue(sessionData)
        mockCacheService.set.mockResolvedValue(undefined)

        // Mock the sign method to return the same signature
        const originalSign = authService.sign
        authService.sign = vi.fn().mockReturnValue(signature)

        const result = await authService.verifyToken(token, ipAddress)

        expect(result).toBeDefined()
        expect(result?.sessionId).toBe(sessionId)
        expect(result?.userId).toBe(userId)

        authService.sign = originalSign
      })

      it('should return null for invalid token format', async () => {
        const invalidToken = 'invalid-token'

        const result = await authService.verifyToken(invalidToken, '127.0.0.1')

        expect(result).toBeNull()
      })

      it('should return null for expired token', async () => {
        const sessionId = 'session-123'
        const ipAddress = '127.0.0.1'

        // Create an expired token
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        const payload = btoa(
          JSON.stringify({
            sessionId,
            exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
            iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
          })
        )
        const signature = 'mock-signature'
        const token = `${header}.${payload}.${signature}`

        const originalSign = authService.sign
        authService.sign = vi.fn().mockReturnValue(signature)

        const result = await authService.verifyToken(token, ipAddress)

        expect(result).toBeNull()

        authService.sign = originalSign
      })
    })
  })

  describe('Google Authentication', () => {
    describe('authenticateWithGoogle', () => {
      it('should authenticate with Google successfully', async () => {
        const code = 'google-auth-code'
        const ipAddress = '127.0.0.1'
        const userAgent = 'test-agent'

        // Mock Google token exchange
        ;(global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'google-access-token',
            token_type: 'Bearer',
          }),
        })

        // Mock Google user profile
        ;(global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sub: 'google-user-id',
            email: 'test@gmail.com',
            name: 'Test User',
            picture: 'https://example.com/avatar.jpg',
          }),
        })

        // Mock user not found
        mockDbClient.queryFirst.mockResolvedValue(null)

        // Mock user creation
        const { User } = require('@/api/src/models/user')
        const mockUser = createMockUser({ email: 'test@gmail.com' })
        User.create.mockReturnValue(mockUser)

        mockDbClient.enhancedTransaction.mockImplementation(async callback => {
          await callback(mockDbClient)
          return mockUser
        })

        // Mock session creation
        mockCacheService.set.mockResolvedValue(undefined)

        const result = await authService.authenticateWithGoogle(code, ipAddress, userAgent)

        expect(result.success).toBe(true)
        expect(result.user).toEqual(mockUser)
        expect(result.isNewUser).toBe(true)
        expect(result.sessionId).toBeDefined()
      })

      it('should return error when Google OAuth not configured', async () => {
        // Configure without Google
        authService.configureProviders({})

        const result = await authService.authenticateWithGoogle('code', '127.0.0.1', 'agent')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Google OAuth not configured')
      })

      it('should handle Google API errors', async () => {
        const code = 'invalid-code'
        const ipAddress = '127.0.0.1'
        const userAgent = 'test-agent'

        // Mock failed token exchange
        ;(global.fetch as any).mockResolvedValueOnce({
          ok: false,
          status: 400,
        })

        const result = await authService.authenticateWithGoogle(code, ipAddress, userAgent)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Google authentication failed')
      })
    })
  })

  describe('GitHub Authentication', () => {
    describe('authenticateWithGitHub', () => {
      it('should authenticate with GitHub successfully', async () => {
        const code = 'github-auth-code'
        const ipAddress = '127.0.0.1'
        const userAgent = 'test-agent'

        // Mock GitHub token exchange
        ;(global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'github-access-token',
            token_type: 'Bearer',
          }),
        })

        // Mock GitHub user profile
        ;(global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 12345,
            login: 'testuser',
            name: 'Test User',
            email: 'test@example.com',
            avatar_url: 'https://example.com/avatar.jpg',
          }),
        })

        // Mock user not found
        mockDbClient.queryFirst.mockResolvedValue(null)

        // Mock user creation
        const { User } = require('@/api/src/models/user')
        const mockUser = createMockUser({ email: 'test@example.com' })
        User.create.mockReturnValue(mockUser)

        mockDbClient.enhancedTransaction.mockImplementation(async callback => {
          await callback(mockDbClient)
          return mockUser
        })

        // Mock session creation
        mockCacheService.set.mockResolvedValue(undefined)

        const result = await authService.authenticateWithGitHub(code, ipAddress, userAgent)

        expect(result.success).toBe(true)
        expect(result.user).toEqual(mockUser)
        expect(result.isNewUser).toBe(true)
        expect(result.sessionId).toBeDefined()
      })

      it('should return error when GitHub OAuth not configured', async () => {
        // Configure without GitHub
        authService.configureProviders({})

        const result = await authService.authenticateWithGitHub('code', '127.0.0.1', 'agent')

        expect(result.success).toBe(false)
        expect(result.error).toBe('GitHub OAuth not configured')
      })
    })
  })

  describe('Rate Limiting', () => {
    describe('checkAuthRateLimit', () => {
      it('should allow requests within limit', async () => {
        const ipAddress = '127.0.0.1'
        mockCacheService.get.mockResolvedValue(5) // 5 previous attempts
        mockCacheService.set.mockResolvedValue(undefined)

        const result = await authService.checkAuthRateLimit(ipAddress)

        expect(result).toBe(true)
        expect(mockCacheService.get).toHaveBeenCalledWith(`auth_rate_limit:${ipAddress}`, {
          namespace: 'sessions',
        })
        expect(mockCacheService.set).toHaveBeenCalledWith(
          `auth_rate_limit:${ipAddress}`,
          6,
          expect.objectContaining({
            namespace: 'sessions',
            ttl: 3600,
          })
        )
      })

      it('should block requests exceeding limit', async () => {
        const ipAddress = '127.0.0.1'
        mockCacheService.get.mockResolvedValue(10) // At limit

        const result = await authService.checkAuthRateLimit(ipAddress)

        expect(result).toBe(false)
        expect(mockCacheService.set).not.toHaveBeenCalled()
      })

      it('should handle cache errors gracefully', async () => {
        const ipAddress = '127.0.0.1'
        mockCacheService.get.mockRejectedValue(new Error('Cache error'))

        const result = await authService.checkAuthRateLimit(ipAddress)

        expect(result).toBe(true) // Fail open
      })
    })
  })

  describe('Cache Management', () => {
    describe('invalidateUserCache', () => {
      it('should invalidate user cache entries', async () => {
        const userId = 'user-123'
        const mockUser = createMockUser({
          id: userId,
          email: 'test@example.com',
        })

        mockDbClient.queryFirst.mockResolvedValue(mockUser)
        const { User } = require('@/api/src/models/user')
        User.fromRow.mockReturnValue(mockUser)

        mockCacheService.invalidate.mockResolvedValue(undefined)
        mockCacheService.delete.mockResolvedValue(undefined)

        await authService.invalidateUserCache(userId)

        expect(mockCacheService.invalidate).toHaveBeenCalledWith({
          namespace: 'cache',
          tags: [`user:${userId}`, `user_tier:${mockUser.subscription_tier}`],
        })
        expect(mockCacheService.delete).toHaveBeenCalledWith(`user_by_email:${mockUser.email}`, {
          namespace: 'cache',
        })
      })
    })

    describe('warmupUserCache', () => {
      it('should warmup user cache', async () => {
        const userId = 'user-123'
        const mockUser = createMockUser({
          id: userId,
          email: 'test@example.com',
        })

        mockDbClient.queryFirst.mockResolvedValue(mockUser)
        const { User } = require('@/api/src/models/user')
        User.fromRow.mockReturnValue(mockUser)

        mockCacheService.set.mockResolvedValue(undefined)

        await authService.warmupUserCache(userId)

        expect(mockCacheService.set).toHaveBeenCalledWith(`user:${userId}`, mockUser, {
          namespace: 'cache',
          ttl: 3600,
          tags: ['user', `user_tier:${mockUser.subscription_tier}`],
        })
        expect(mockCacheService.set).toHaveBeenCalledWith(
          `user_by_email:${mockUser.email}`,
          mockUser,
          {
            namespace: 'cache',
            ttl: 3600,
            tags: ['user', 'email_lookup'],
          }
        )
      })
    })

    describe('getCacheMetrics', () => {
      it('should return cache metrics', () => {
        const mockMetrics = {
          hits: 100,
          misses: 20,
          hitRate: 0.83,
        }

        mockCacheService.getMetrics.mockReturnValue(mockMetrics)

        const result = authService.getCacheMetrics()

        expect(result).toEqual(mockMetrics)
      })

      it('should return null when cache service not available', () => {
        const serviceWithoutCache = new AuthService({
          db: mockDb as any,
          kv: mockKv,
          jwtSecret: 'test-secret',
          enableAdvancedCaching: false,
        })

        const result = serviceWithoutCache.getCacheMetrics()

        expect(result).toBeNull()
      })
    })
  })

  describe('Helper Methods', () => {
    describe('validateEmail', () => {
      it('should validate correct email format', async () => {
        const result = await authService.validateEmail('test@example.com')
        expect(result).toBe(true)
      })

      it('should reject invalid email format', async () => {
        const result = await authService.validateEmail('invalid-email')
        expect(result).toBe(false)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle OAuth API errors gracefully', async () => {
      const code = 'test-code'
      const ipAddress = '127.0.0.1'
      const userAgent = 'test-agent'

      // Mock network error
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      const result = await authService.authenticateWithGoogle(code, ipAddress, userAgent)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Google authentication failed')
    })

    it('should handle database errors in user creation', async () => {
      const code = 'test-code'
      const ipAddress = '127.0.0.1'
      const userAgent = 'test-agent'

      // Mock successful OAuth
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'google-access-token',
        }),
      })

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sub: 'google-user-id',
          email: 'test@gmail.com',
          name: 'Test User',
        }),
      })

      // Mock user not found
      mockDbClient.queryFirst.mockResolvedValue(null)

      // Mock database error during user creation
      mockDbClient.enhancedTransaction.mockRejectedValue(new Error('Database error'))

      const result = await authService.authenticateWithGoogle(code, ipAddress, userAgent)

      expect(result.success).toBe(false)
      expect(result.error).toBe('User creation failed')
    })

    it('should handle KV storage errors gracefully', async () => {
      const sessionId = 'session-123'
      mockCacheService.get.mockRejectedValue(new Error('KV error'))

      const result = await authService.getSession(sessionId)

      expect(result).toBeNull()
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complete OAuth flow for existing user', async () => {
      const code = 'google-auth-code'
      const ipAddress = '127.0.0.1'
      const userAgent = 'test-agent'
      const existingUser = createMockUser({ email: 'existing@gmail.com' })
      const existingAuthIdentity = createMockAuthIdentity({
        provider: 'google',
        provider_uid: 'google-user-id',
        user_id: existingUser.id,
      })

      // Mock successful OAuth
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'google-access-token',
        }),
      })

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sub: 'google-user-id',
          email: 'existing@gmail.com',
          name: 'Existing User',
        }),
      })

      // Mock existing auth identity
      mockDbClient.queryFirst
        .mockResolvedValueOnce(existingAuthIdentity) // auth identity exists
        .mockResolvedValueOnce(existingUser) // user lookup

      const { User } = require('@/api/src/models/user')
      User.fromRow.mockReturnValue(existingUser)

      // Mock session creation
      mockCacheService.set.mockResolvedValue(undefined)

      const result = await authService.authenticateWithGoogle(code, ipAddress, userAgent)

      expect(result.success).toBe(true)
      expect(result.user).toEqual(existingUser)
      expect(result.isNewUser).toBe(false)
      expect(result.sessionId).toBeDefined()
    })

    it('should handle OAuth flow with email-only user', async () => {
      const code = 'github-auth-code'
      const ipAddress = '127.0.0.1'
      const userAgent = 'test-agent'
      const existingUser = createMockUser({ email: 'test@example.com' })

      // Mock successful OAuth
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'github-access-token',
        }),
      })

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 12345,
          login: 'testuser',
          name: 'Test User',
          email: 'test@example.com',
          avatar_url: 'https://example.com/avatar.jpg',
        }),
      })

      // Mock auth identity not found, but user exists
      mockDbClient.queryFirst
        .mockResolvedValueOnce(null) // no auth identity
        .mockResolvedValueOnce(existingUser) // user found by email

      const { User } = require('@/api/src/models/user')
      User.fromRow.mockReturnValue(existingUser)

      // Mock auth identity creation
      const { AuthIdentity } = require('@/api/src/models/auth_identity')
      const mockAuthIdentity = createMockAuthIdentity({
        user_id: existingUser.id,
        provider: 'github',
        provider_uid: '12345',
      })
      AuthIdentity.create.mockReturnValue(mockAuthIdentity)

      mockDbClient.enhancedTransaction.mockImplementation(async callback => {
        await callback(mockDbClient)
        return mockAuthIdentity
      })

      // Mock session creation
      mockCacheService.set.mockResolvedValue(undefined)

      const result = await authService.authenticateWithGitHub(code, ipAddress, userAgent)

      expect(result.success).toBe(true)
      expect(result.user).toEqual(existingUser)
      expect(result.isNewUser).toBe(false)
      expect(result.sessionId).toBeDefined()
    })
  })
})
