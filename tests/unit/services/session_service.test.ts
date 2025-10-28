import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SessionError, SessionService } from '@/api/src/services/session_service'
import {
  cleanupTestEnvironment,
  createMockAuditLog,
  createMockUser,
  createTestDatabase,
  type MockD1Database,
  setupTestEnvironment,
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

// Mock AuthService
vi.mock('@/api/src/services/auth_service', () => ({
  AuthService: vi.fn().mockImplementation(() => ({
    getSession: vi.fn(),
    createSession: vi.fn(),
    deleteSession: vi.fn(),
    updateSession: vi.fn(),
    verifyToken: vi.fn(),
    generateToken: vi.fn(),
  })),
  TokenPayload: {},
}))

// Mock RateLimitService
vi.mock('@/api/src/services/rate_limit_service', () => ({
  RateLimitService: vi.fn().mockImplementation(() => ({
    checkRateLimit: vi.fn(),
    consumeQuota: vi.fn(),
    resetQuota: vi.fn(),
    getQuotaUsage: vi.fn(),
  })),
}))

// Mock Durable Objects
const createMockDurableObject = (id: string) => ({
  id: {
    toString: () => id,
  },
  fetch: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
})

// Mock environment
const createMockEnv = () => ({
  DB: {} as D1Database,
  SESSION_MANAGER_DO: createMockDurableObject('session-manager'),
  COLLABORATION_DO: createMockDurableObject('collaboration'),
  KV: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
  },
})

describe('SessionService', () => {
  let sessionService: SessionService
  let mockEnv: any
  let mockDb: MockD1Database
  let mockSessionManagerDO: any
  let mockCollaborationDO: any
  let _mockAuthService: any
  let _mockRateLimitService: any

  beforeEach(() => {
    setupTestEnvironment()

    mockDb = createTestDatabase({
      users: [createMockUser()],
      audit_logs: [createMockAuditLog()],
    })

    mockEnv = createMockEnv()
    mockEnv.DB = mockDb as any
    mockSessionManagerDO = mockEnv.SESSION_MANAGER_DO
    mockCollaborationDO = mockEnv.COLLABORATION_DO

    const { AuthService } = require('@/api/src/services/auth_service')
    _mockAuthService = new AuthService({} as any)

    const { RateLimitService } = require('@/api/src/services/rate_limit_service')
    _mockRateLimitService = new RateLimitService({} as any)

    sessionService = new SessionService(mockEnv, {
      defaultTTL: 86400000, // 24 hours
      maxTTL: 604800000, // 7 days
      cleanupInterval: 300000, // 5 minutes
      maxConnectionsPerSession: 10,
      enableMetrics: true,
      enableAuditLog: true,
      collaborationEnabled: true,
    })
  })

  afterEach(() => {
    cleanupTestEnvironment()
    vi.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should initialize with default configuration', () => {
      const service = new SessionService(mockEnv)
      expect(service).toBeDefined()
    })

    it('should initialize with custom configuration', () => {
      const service = new SessionService(mockEnv, {
        defaultTTL: 3600000, // 1 hour
        maxTTL: 86400000, // 24 hours
        enableMetrics: false,
        enableAuditLog: false,
        collaborationEnabled: false,
      })
      expect(service).toBeDefined()
    })
  })

  describe('createSession', () => {
    it('should create a session successfully', async () => {
      const options: any = {
        userId: 'user-123',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        ttl: 3600000, // 1 hour
        persistent: true,
        metadata: { source: 'web' },
      }

      const mockSessionData = {
        sessionId: 'session-123',
        userId: options.userId,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        expiresAt: Date.now() + options.ttl,
        metadata: options.metadata,
        connections: [],
      }

      mockSessionManagerDO.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockSessionData,
      })

      const result = await sessionService.createSession(options)

      expect(result).toEqual(mockSessionData)
      expect(mockSessionManagerDO.fetch).toHaveBeenCalledWith('https://session-manager/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          userId: options.userId,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          ttl: options.ttl,
          persistent: options.persistent,
          metadata: options.metadata,
        }),
      })
    })

    it('should create anonymous session', async () => {
      const options: any = {
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        ttl: 1800000, // 30 minutes
      }

      const mockSessionData = {
        sessionId: 'session-anon-123',
        userId: undefined,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        expiresAt: Date.now() + options.ttl,
        connections: [],
      }

      mockSessionManagerDO.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockSessionData,
      })

      const result = await sessionService.createSession(options)

      expect(result.userId).toBeUndefined()
      expect(result.ipAddress).toBe(options.ipAddress)
    })

    it('should enforce maximum TTL', async () => {
      const options: any = {
        userId: 'user-123',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        ttl: 10 * 24 * 60 * 60 * 1000, // 10 days (exceeds max)
      }

      const maxTTL = 7 * 24 * 60 * 60 * 1000 // 7 days
      const mockSessionData = {
        sessionId: 'session-123',
        userId: options.userId,
        expiresAt: Date.now() + maxTTL,
      }

      mockSessionManagerDO.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockSessionData,
      })

      await sessionService.createSession(options)

      const requestBody = JSON.parse(mockSessionManagerDO.fetch.mock.calls[0][1].body)
      expect(requestBody.ttl).toBeLessThanOrEqual(maxTTL)
    })

    it('should handle session creation errors', async () => {
      const options: any = {
        userId: 'user-123',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      }

      mockSessionManagerDO.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal server error',
      })

      await expect(sessionService.createSession(options)).rejects.toThrow(
        'Failed to create session'
      )
    })
  })

  describe('getSession', () => {
    it('should retrieve existing session', async () => {
      const sessionId = 'session-123'
      const mockSessionData = {
        sessionId,
        userId: 'user-123',
        ipAddress: '127.0.0.1',
        lastAccessed: Date.now() - 1000,
        expiresAt: Date.now() + 3600000,
      }

      mockSessionManagerDO.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockSessionData,
      })

      const result = await sessionService.getSession(sessionId)

      expect(result).toEqual(mockSessionData)
      expect(mockSessionManagerDO.fetch).toHaveBeenCalledWith(
        `https://session-manager/?sessionId=${sessionId}`,
        {
          method: 'GET',
        }
      )
    })

    it('should return null for non-existent session', async () => {
      const sessionId = 'nonexistent-session'

      mockSessionManagerDO.fetch.mockResolvedValue({
        ok: false,
        status: 404,
      })

      const result = await sessionService.getSession(sessionId)

      expect(result).toBeNull()
    })

    it('should return null for expired session', async () => {
      const sessionId = 'expired-session'
      const mockSessionData = {
        sessionId,
        userId: 'user-123',
        expiresAt: Date.now() - 3600000, // Expired 1 hour ago
      }

      mockSessionManagerDO.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockSessionData,
      })

      const result = await sessionService.getSession(sessionId)

      expect(result).toBeNull()
    })
  })

  describe('updateSession', () => {
    it('should update session successfully', async () => {
      const sessionId = 'session-123'
      const updates = {
        metadata: { lastAction: 'file-upload' },
        customLimits: { apiCalls: 200 },
      }

      const existingSession = {
        sessionId,
        userId: 'user-123',
        metadata: { source: 'web' },
      }

      const updatedSession = {
        ...existingSession,
        ...updates,
        lastAccessed: Date.now(),
      }

      mockSessionManagerDO.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => existingSession,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => updatedSession,
        })

      const result = await sessionService.updateSession(sessionId, updates)

      expect(result).toEqual(updatedSession)
      expect(mockSessionManagerDO.fetch).toHaveBeenCalledWith('https://session-manager/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          sessionId,
          updates,
        }),
      })
    })

    it('should throw error for non-existent session', async () => {
      const sessionId = 'nonexistent-session'
      const updates = { metadata: { test: 'data' } }

      mockSessionManagerDO.fetch.mockResolvedValue({
        ok: false,
        status: 404,
      })

      await expect(sessionService.updateSession(sessionId, updates)).rejects.toThrow(
        SessionError.SESSION_NOT_FOUND
      )
    })
  })

  describe('deleteSession', () => {
    it('should delete session successfully', async () => {
      const sessionId = 'session-123'
      const existingSession = {
        sessionId,
        userId: 'user-123',
      }

      mockSessionManagerDO.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => existingSession,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })

      await sessionService.deleteSession(sessionId)

      expect(mockSessionManagerDO.fetch).toHaveBeenCalledWith('https://session-manager/', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          sessionId,
        }),
      })
    })

    it('should handle deletion of non-existent session', async () => {
      const sessionId = 'nonexistent-session'

      mockSessionManagerDO.fetch.mockResolvedValue({
        ok: false,
        status: 404,
      })

      await expect(sessionService.deleteSession(sessionId)).rejects.toThrow(
        SessionError.SESSION_NOT_FOUND
      )
    })
  })

  describe('listSessions', () => {
    it('should list sessions with filters', async () => {
      const options = {
        userId: 'user-123',
        activeOnly: true,
        limit: 10,
        offset: 0,
        sortBy: 'lastAccessed' as const,
        sortOrder: 'desc' as const,
      }

      const mockSessions = [
        {
          sessionId: 'session-1',
          userId: options.userId,
          lastAccessed: Date.now() - 1000,
        },
        {
          sessionId: 'session-2',
          userId: options.userId,
          lastAccessed: Date.now() - 5000,
        },
      ]

      mockSessionManagerDO.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          sessions: mockSessions,
          total: 2,
        }),
      })

      const result = await sessionService.listSessions(options)

      expect(result.sessions).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(mockSessionManagerDO.fetch).toHaveBeenCalledWith('https://session-manager/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'list',
          ...options,
        }),
      })
    })

    it('should list all sessions without filters', async () => {
      const mockSessions = [{ sessionId: 'session-1' }, { sessionId: 'session-2' }]

      mockSessionManagerDO.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          sessions: mockSessions,
          total: 2,
        }),
      })

      const result = await sessionService.listSessions()

      expect(result.sessions).toHaveLength(2)
      expect(result.total).toBe(2)
    })
  })

  describe('Session Collaboration', () => {
    describe('createCollaborationRoom', () => {
      it('should create collaboration room', async () => {
        const sessionId = 'session-123'
        const roomOptions = {
          name: 'Test Room',
          description: 'A test collaboration room',
          maxParticipants: 5,
          isPublic: false,
        }

        const mockRoom = {
          roomId: 'room-123',
          sessionId,
          name: roomOptions.name,
          description: roomOptions.description,
          participants: [],
          createdAt: Date.now(),
        }

        mockCollaborationDO.fetch.mockResolvedValue({
          ok: true,
          json: async () => mockRoom,
        })

        const result = await sessionService.createCollaborationRoom(sessionId, roomOptions)

        expect(result).toEqual(mockRoom)
        expect(mockCollaborationDO.fetch).toHaveBeenCalledWith('https://collaboration/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'createRoom',
            sessionId,
            ...roomOptions,
          }),
        })
      })

      it('should throw error when collaboration disabled', async () => {
        const serviceWithoutCollaboration = new SessionService(mockEnv, {
          collaborationEnabled: false,
        })

        await expect(
          serviceWithoutCollaboration.createCollaborationRoom('session-123', {})
        ).rejects.toThrow(SessionError.COLLABORATION_DISABLED)
      })
    })

    describe('joinCollaborationRoom', () => {
      it('should join collaboration room', async () => {
        const sessionId = 'session-123'
        const roomId = 'room-123'
        const participantInfo = {
          name: 'Test User',
          role: 'editor',
        }

        const mockRoom = {
          roomId,
          participants: [
            {
              sessionId,
              name: participantInfo.name,
              role: participantInfo.role,
              joinedAt: Date.now(),
            },
          ],
        }

        mockCollaborationDO.fetch.mockResolvedValue({
          ok: true,
          json: async () => mockRoom,
        })

        const result = await sessionService.joinCollaborationRoom(
          sessionId,
          roomId,
          participantInfo
        )

        expect(result.participants).toHaveLength(1)
        expect(result.participants[0].sessionId).toBe(sessionId)
      })

      it('should throw error when room not found', async () => {
        const sessionId = 'session-123'
        const roomId = 'nonexistent-room'

        mockCollaborationDO.fetch.mockResolvedValue({
          ok: false,
          status: 404,
        })

        await expect(sessionService.joinCollaborationRoom(sessionId, roomId)).rejects.toThrow(
          SessionError.ROOM_NOT_FOUND
        )
      })
    })

    describe('leaveCollaborationRoom', () => {
      it('should leave collaboration room', async () => {
        const sessionId = 'session-123'
        const roomId = 'room-123'

        const mockRoom = {
          roomId,
          participants: [], // Empty after leaving
        }

        mockCollaborationDO.fetch.mockResolvedValue({
          ok: true,
          json: async () => mockRoom,
        })

        const result = await sessionService.leaveCollaborationRoom(sessionId, roomId)

        expect(result.participants).toHaveLength(0)
      })
    })

    describe('sendCollaborationMessage', () => {
      it('should send message to room', async () => {
        const sessionId = 'session-123'
        const roomId = 'room-123'
        const message = {
          type: 'text',
          content: 'Hello, world!',
        }

        const mockMessage = {
          messageId: 'msg-123',
          sessionId,
          roomId,
          type: message.type,
          content: message.content,
          timestamp: Date.now(),
        }

        mockCollaborationDO.fetch.mockResolvedValue({
          ok: true,
          json: async () => mockMessage,
        })

        const result = await sessionService.sendCollaborationMessage(sessionId, roomId, message)

        expect(result).toEqual(mockMessage)
      })

      it('should throw error for invalid message type', async () => {
        const sessionId = 'session-123'
        const roomId = 'room-123'
        const message = {
          type: 'invalid',
          content: 'test',
        }

        await expect(
          sessionService.sendCollaborationMessage(sessionId, roomId, message)
        ).rejects.toThrow(SessionError.INVALID_OPERATION)
      })
    })
  })

  describe('Session Analytics', () => {
    describe('getSessionStats', () => {
      it('should return session statistics', async () => {
        const mockStats = {
          totalSessions: 1000,
          activeSessions: 250,
          expiredSessions: 750,
          totalConnections: 500,
          averageSessionDuration: 1800000, // 30 minutes
          peakConcurrentSessions: 300,
          collaborationStats: {
            activeRooms: 25,
            totalParticipants: 75,
            activeOperations: 150,
          },
        }

        mockSessionManagerDO.fetch.mockResolvedValue({
          ok: true,
          json: async () => mockStats,
        })

        const result = await sessionService.getSessionStats()

        expect(result.totalSessions).toBe(1000)
        expect(result.activeSessions).toBe(250)
        expect(result.collaborationStats.activeRooms).toBe(25)
      })
    })

    describe('getUserSessionHistory', () => {
      it('should return user session history', async () => {
        const userId = 'user-123'
        const options = {
          limit: 10,
          includeExpired: true,
        }

        const mockHistory = [
          {
            sessionId: 'session-1',
            userId,
            createdAt: Date.now() - 86400000, // 1 day ago
            duration: 3600000, // 1 hour
          },
          {
            sessionId: 'session-2',
            userId,
            createdAt: Date.now() - 172800000, // 2 days ago
            duration: 1800000, // 30 minutes
          },
        ]

        mockSessionManagerDO.fetch.mockResolvedValue({
          ok: true,
          json: async () => mockHistory,
        })

        const result = await sessionService.getUserSessionHistory(userId, options)

        expect(result).toHaveLength(2)
        expect(result[0].sessionId).toBe('session-1')
        expect(result[0].userId).toBe(userId)
      })
    })
  })

  describe('Session Cleanup', () => {
    describe('cleanupExpiredSessions', () => {
      it('should cleanup expired sessions', async () => {
        const mockResult = {
          deletedSessions: 150,
          deletedRooms: 25,
          freedMemory: 1024000, // bytes
        }

        mockSessionManagerDO.fetch.mockResolvedValue({
          ok: true,
          json: async () => mockResult,
        })

        const result = await sessionService.cleanupExpiredSessions()

        expect(result.deletedSessions).toBe(150)
        expect(result.deletedRooms).toBe(25)
        expect(mockSessionManagerDO.fetch).toHaveBeenCalledWith('https://session-manager/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'cleanup',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          }),
        })
      })
    })

    describe('cleanupInactiveRooms', () => {
      it('should cleanup inactive collaboration rooms', async () => {
        const mockResult = {
          deletedRooms: 10,
          deletedMessages: 50,
        }

        mockCollaborationDO.fetch.mockResolvedValue({
          ok: true,
          json: async () => mockResult,
        })

        const result = await sessionService.cleanupInactiveRooms()

        expect(result.deletedRooms).toBe(10)
        expect(result.deletedMessages).toBe(50)
      })
    })
  })

  describe('Session Security', () => {
    describe('validateSession', () => {
      it('should validate active session', async () => {
        const sessionId = 'session-123'
        const ipAddress = '127.0.0.1'
        const userAgent = 'test-agent'

        const mockSession = {
          sessionId,
          userId: 'user-123',
          ipAddress,
          userAgent,
          lastAccessed: Date.now() - 1000,
          expiresAt: Date.now() + 3600000,
        }

        mockSessionManagerDO.fetch.mockResolvedValue({
          ok: true,
          json: async () => mockSession,
        })

        const result = await sessionService.validateSession(sessionId, ipAddress, userAgent)

        expect(result.valid).toBe(true)
        expect(result.session).toEqual(mockSession)
      })

      it('should reject session with different IP address', async () => {
        const sessionId = 'session-123'
        const ipAddress = '192.168.1.100' // Different IP
        const userAgent = 'test-agent'

        const mockSession = {
          sessionId,
          userId: 'user-123',
          ipAddress: '127.0.0.1', // Original IP
          userAgent,
          lastAccessed: Date.now() - 1000,
          expiresAt: Date.now() + 3600000,
        }

        mockSessionManagerDO.fetch.mockResolvedValue({
          ok: true,
          json: async () => mockSession,
        })

        const result = await sessionService.validateSession(sessionId, ipAddress, userAgent)

        expect(result.valid).toBe(false)
        expect(result.reason).toContain('IP address mismatch')
      })

      it('should reject expired session', async () => {
        const sessionId = 'expired-session'
        const ipAddress = '127.0.0.1'
        const userAgent = 'test-agent'

        const mockSession = {
          sessionId,
          userId: 'user-123',
          ipAddress,
          userAgent,
          expiresAt: Date.now() - 3600000, // Expired
        }

        mockSessionManagerDO.fetch.mockResolvedValue({
          ok: true,
          json: async () => mockSession,
        })

        const result = await sessionService.validateSession(sessionId, ipAddress, userAgent)

        expect(result.valid).toBe(false)
        expect(result.reason).toContain('expired')
      })
    })

    describe('enforceConnectionLimits', () => {
      it('should allow connections within limit', async () => {
        const sessionId = 'session-123'
        const mockSession = {
          sessionId,
          connections: [
            { id: 'conn-1', connectedAt: Date.now() - 60000 },
            { id: 'conn-2', connectedAt: Date.now() - 30000 },
          ],
        }

        mockSessionManagerDO.fetch.mockResolvedValue({
          ok: true,
          json: async () => mockSession,
        })

        const result = await sessionService.enforceConnectionLimits(sessionId)

        expect(result.allowed).toBe(true)
      })

      it('should reject connections exceeding limit', async () => {
        const sessionId = 'session-123'
        const maxConnections = 10
        const mockSession = {
          sessionId,
          connections: Array.from({ length: maxConnections }, (_, i) => ({
            id: `conn-${i}`,
            connectedAt: Date.now() - i * 1000,
          })),
        }

        mockSessionManagerDO.fetch.mockResolvedValue({
          ok: true,
          json: async () => mockSession,
        })

        const result = await sessionService.enforceConnectionLimits(sessionId)

        expect(result.allowed).toBe(false)
        expect(result.reason).toContain('connection limit exceeded')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle durable object communication errors', async () => {
      const sessionId = 'session-123'

      mockSessionManagerDO.fetch.mockRejectedValue(new Error('Network error'))

      await expect(sessionService.getSession(sessionId)).rejects.toThrow(
        'Failed to communicate with session manager'
      )
    })

    it('should handle malformed session data', async () => {
      const sessionId = 'session-123'

      mockSessionManagerDO.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: 'data' }),
      })

      await expect(sessionService.getSession(sessionId)).rejects.toThrow('Invalid session data')
    })

    it('should handle permission errors', async () => {
      const sessionId = 'session-123'
      const userId = 'different-user'

      const mockSession = {
        sessionId,
        userId: 'user-123', // Different user
        privateData: 'sensitive',
      }

      mockSessionManagerDO.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockSession,
      })

      await expect(sessionService.accessPrivateSessionData(sessionId, userId)).rejects.toThrow(
        SessionError.INSUFFICIENT_PERMISSIONS
      )
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complete session lifecycle', async () => {
      const userId = 'user-123'
      const ipAddress = '127.0.0.1'
      const userAgent = 'test-agent'

      // 1. Create session
      const createOptions = {
        userId,
        ipAddress,
        userAgent,
        metadata: { source: 'web' },
      }

      const mockSession = {
        sessionId: 'session-123',
        userId,
        ipAddress,
        userAgent,
        createdAt: Date.now(),
        metadata: createOptions.metadata,
        connections: [],
      }

      mockSessionManagerDO.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockSession,
      })

      const createdSession = await sessionService.createSession(createOptions)
      expect(createdSession.sessionId).toBe('session-123')

      // 2. Get session
      mockSessionManagerDO.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockSession,
      })

      const retrievedSession = await sessionService.getSession(createdSession.sessionId)
      expect(retrievedSession).toEqual(mockSession)

      // 3. Update session
      const updates = { metadata: { lastAction: 'login' } }
      const updatedSession = { ...mockSession, ...updates }

      mockSessionManagerDO.fetch.mockResolvedValue({
        ok: true,
        json: async () => updatedSession,
      })

      const result = await sessionService.updateSession(createdSession.sessionId, updates)
      expect(result.metadata.lastAction).toBe('login')

      // 4. Create collaboration room
      const roomOptions = { name: 'Test Room' }
      const mockRoom = {
        roomId: 'room-123',
        sessionId: createdSession.sessionId,
        name: roomOptions.name,
        participants: [],
      }

      mockCollaborationDO.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockRoom,
      })

      const room = await sessionService.createCollaborationRoom(
        createdSession.sessionId,
        roomOptions
      )
      expect(room.roomId).toBe('room-123')

      // 5. Join room
      const participantInfo = { name: 'Test User' }
      const roomWithParticipant = {
        ...mockRoom,
        participants: [
          {
            sessionId: createdSession.sessionId,
            name: participantInfo.name,
            joinedAt: Date.now(),
          },
        ],
      }

      mockCollaborationDO.fetch.mockResolvedValue({
        ok: true,
        json: async () => roomWithParticipant,
      })

      const joinedRoom = await sessionService.joinCollaborationRoom(
        createdSession.sessionId,
        room.roomId,
        participantInfo
      )
      expect(joinedRoom.participants).toHaveLength(1)

      // 6. Send message
      const message = { type: 'text', content: 'Hello!' }
      const mockMessage = {
        messageId: 'msg-123',
        sessionId: createdSession.sessionId,
        roomId: room.roomId,
        ...message,
        timestamp: Date.now(),
      }

      mockCollaborationDO.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockMessage,
      })

      const sentMessage = await sessionService.sendCollaborationMessage(
        createdSession.sessionId,
        room.roomId,
        message
      )
      expect(sentMessage.content).toBe('Hello!')

      // 7. Leave room
      const emptyRoom = { ...roomWithParticipant, participants: [] }
      mockCollaborationDO.fetch.mockResolvedValue({
        ok: true,
        json: async () => emptyRoom,
      })

      await sessionService.leaveCollaborationRoom(createdSession.sessionId, room.roomId)

      // 8. Delete session
      mockSessionManagerDO.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      await sessionService.deleteSession(createdSession.sessionId)

      // Verify all expected calls were made
      expect(mockSessionManagerDO.fetch).toHaveBeenCalledTimes(4)
      expect(mockCollaborationDO.fetch).toHaveBeenCalledTimes(4)
    })
  })
})
