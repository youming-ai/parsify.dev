/**
 * Session Service
 *
 * Provides high-level session management functionality that integrates
 * with Durable Objects for real-time features and stateful sessions.
 */

import type {
  CollaborationRoom,
  EnhancedSessionData,
  SessionEvent,
} from '../durable-objects/session-manager'
import type { User } from '../models/user'
import { AuthService, type TokenPayload } from './auth_service'
import { RateLimitService } from './rate_limit_service'

// Session configuration
export interface SessionConfig {
  defaultTTL: number
  maxTTL: number
  cleanupInterval: number
  maxConnectionsPerSession: number
  enableMetrics: boolean
  enableAuditLog: boolean
  collaborationEnabled: boolean
}

// Session creation options
export interface CreateSessionOptions {
  userId?: string
  ipAddress?: string
  userAgent?: string
  ttl?: number
  persistent?: boolean
  metadata?: Record<string, any>
  customLimits?: Record<string, number>
  enableCollaboration?: boolean
}

// Session query options
export interface SessionQueryOptions {
  userId?: string
  activeOnly?: boolean
  includeExpired?: boolean
  limit?: number
  offset?: number
  sortBy?: 'createdAt' | 'lastAccessed' | 'expiresAt'
  sortOrder?: 'asc' | 'desc'
}

// Session statistics
export interface SessionStats {
  totalSessions: number
  activeSessions: number
  expiredSessions: number
  totalConnections: number
  averageSessionDuration: number
  peakConcurrentSessions: number
  collaborationStats: {
    activeRooms: number
    totalParticipants: number
    activeOperations: number
  }
}

// Session service error types
export enum SessionError {
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_SESSION_ID = 'INVALID_SESSION_ID',
  SESSION_LIMIT_EXCEEDED = 'SESSION_LIMIT_EXCEEDED',
  CONNECTION_LIMIT_EXCEEDED = 'CONNECTION_LIMIT_EXCEEDED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  COLLABORATION_DISABLED = 'COLLABORATION_DISABLED',
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  INVALID_OPERATION = 'INVALID_OPERATION',
  SERVICE_ERROR = 'SERVICE_ERROR',
}

export class SessionService {
  private env: Env
  private config: SessionConfig
  private authService: AuthService

  constructor(env: Env, config?: Partial<SessionConfig>) {
    this.env = env
    this.config = {
      defaultTTL: 86400000, // 24 hours
      maxTTL: 604800000, // 7 days
      cleanupInterval: 300000, // 5 minutes
      maxConnectionsPerSession: 10,
      enableMetrics: true,
      enableAuditLog: true,
      collaborationEnabled: true,
      ...config,
    }

    this.authService = new AuthService({
      db: env.DB,
      kv: env.SESSIONS,
      jwtSecret: env.JWT_SECRET || 'default-secret',
      auditEnabled: this.config.enableAuditLog,
      sessionTimeoutMinutes: Math.floor(this.config.defaultTTL / 60000),
    })

    this.rateLimitService = new RateLimitService({
      db: env.DB,
      kv: env.CACHE,
      auditEnabled: this.config.enableAuditLog,
      enableDistributedLimiting: true,
    })
  }

  /**
   * Create a new session
   */
  async createSession(options: CreateSessionOptions): Promise<EnhancedSessionData> {
    const {
      userId,
      ipAddress,
      userAgent,
      ttl = this.config.defaultTTL,
      persistent = false,
      metadata,
      customLimits,
      enableCollaboration = this.config.collaborationEnabled,
    } = options

    // Validate TTL
    if (ttl > this.config.maxTTL) {
      throw new Error(`TTL cannot exceed ${this.config.maxTTL}ms`)
    }

    // Check session limits for user
    if (userId) {
      await this.checkSessionLimits(userId)
    }

    const sessionId = crypto.randomUUID()

    // Get user data if userId provided
    let _user: User | undefined
    if (userId) {
      try {
        const userService = new (await import('./user_service')).UserService(this.env.DB)
        _user = await userService.findById(userId)
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      }
    }

    const sessionData: any = {
      ttl,
      persistent,
      metadata: {
        ...metadata,
        persistent,
        enableCollaboration,
        createdVia: 'session_service',
      },
      customLimits,
    }

    // Create session via Durable Object
    const sessionManager = this.env.SESSION_MANAGER as DurableObject
    const response = await sessionManager.fetch(
      new Request(`https://dummy-url/session/${sessionId}?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CF-Connecting-IP': ipAddress || 'unknown',
          'User-Agent': userAgent || 'unknown',
        },
        body: JSON.stringify(sessionData),
      })
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create session: ${error}`)
    }

    const session: EnhancedSessionData = await response.json()

    // Log session creation
    if (this.config.enableAuditLog) {
      await this.logSessionEvent({
        type: 'session_created',
        sessionId,
        userId,
        timestamp: Date.now(),
        data: { ttl, persistent, enableCollaboration },
      })
    }

    return session
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string, includeExpired = false): Promise<EnhancedSessionData | null> {
    try {
      const sessionManager = this.env.SESSION_MANAGER as DurableObject
      const response = await sessionManager.fetch(
        new Request(`https://dummy-url/session/${sessionId}`, {
          method: 'GET',
        })
      )

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Failed to get session: ${response.statusText}`)
      }

      const session: EnhancedSessionData = await response.json()

      // Check if session is expired (unless explicitly included)
      if (!includeExpired && Date.now() > session.expiresAt) {
        await this.deleteSession(sessionId)
        return null
      }

      return session
    } catch (error) {
      console.error('Failed to get session:', error)
      return null
    }
  }

  /**
   * Update session data
   */
  async updateSession(
    sessionId: string,
    updates: Partial<EnhancedSessionData>,
    userId?: string
  ): Promise<EnhancedSessionData | null> {
    try {
      const sessionManager = this.env.SESSION_MANAGER as DurableObject
      const url = new URL(`https://dummy-url/session/${sessionId}`)
      if (userId) {
        url.searchParams.set('userId', userId)
      }

      const response = await sessionManager.fetch(
        new Request(url.toString(), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
      )

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Failed to update session: ${response.statusText}`)
      }

      const session: EnhancedSessionData = await response.json()

      // Log session update
      if (this.config.enableAuditLog) {
        await this.logSessionEvent({
          type: 'session_updated',
          sessionId,
          userId,
          timestamp: Date.now(),
          data: { updatedFields: Object.keys(updates) },
        })
      }

      return session
    } catch (error) {
      console.error('Failed to update session:', error)
      return null
    }
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string, userId?: string): Promise<boolean> {
    try {
      const sessionManager = this.env.SESSION_MANAGER as DurableObject
      const url = new URL(`https://dummy-url/session/${sessionId}`)
      if (userId) {
        url.searchParams.set('userId', userId)
      }

      const response = await sessionManager.fetch(
        new Request(url.toString(), {
          method: 'DELETE',
        })
      )

      if (!response.ok) {
        if (response.status === 404) {
          return false
        }
        throw new Error(`Failed to delete session: ${response.statusText}`)
      }

      // Log session deletion
      if (this.config.enableAuditLog) {
        await this.logSessionEvent({
          type: 'session_deleted',
          sessionId,
          userId,
          timestamp: Date.now(),
        })
      }

      return true
    } catch (error) {
      console.error('Failed to delete session:', error)
      return false
    }
  }

  /**
   * Get user sessions
   */
  async getUserSessions(
    _userId: string,
    _options: SessionQueryOptions = {}
  ): Promise<EnhancedSessionData[]> {
    // This would typically query a database index for user sessions
    // For now, we'll return an empty array as this would require
    // additional database setup
    return []
  }

  /**
   * Create WebSocket connection for session
   */
  async createSessionWebSocket(
    sessionId: string,
    userId?: string,
    token?: string,
    roomId?: string
  ): Promise<string> {
    try {
      const sessionManager = this.env.SESSION_MANAGER as DurableObject
      const url = new URL(`https://dummy-url/websocket`)
      url.searchParams.set('sessionId', sessionId)
      if (userId) {
        url.searchParams.set('userId', userId)
      }
      if (token) {
        url.searchParams.set('token', token)
      }
      if (roomId) {
        url.searchParams.set('roomId', roomId)
      }

      const response = await sessionManager.fetch(
        new Request(url.toString(), {
          method: 'GET',
          headers: {
            Upgrade: 'websocket',
            Connection: 'Upgrade',
          },
        })
      )

      if (!response.ok) {
        throw new Error(`Failed to create WebSocket: ${response.statusText}`)
      }

      // Return WebSocket URL for client to connect to
      return `wss://${this.env.WEBSOCKET_HOST}/session/${sessionId}/websocket`
    } catch (error) {
      console.error('Failed to create session WebSocket:', error)
      throw error
    }
  }

  /**
   * Create collaboration room
   */
  async createCollaborationRoom(
    sessionId: string,
    roomData: {
      name: string
      type: string
      settings?: Record<string, any>
    },
    userId?: string
  ): Promise<CollaborationRoom> {
    if (!this.config.collaborationEnabled) {
      throw new Error('Collaboration is disabled')
    }

    try {
      const roomName = `room-${crypto.randomUUID()}`
      const collaborationRoom = this.env.COLLABORATION_ROOM as DurableObject

      const response = await collaborationRoom.fetch(
        new Request(`https://dummy-url/room/${roomName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...roomData,
            ownerId: userId,
            sessionId,
          }),
        })
      )

      if (!response.ok) {
        throw new Error(`Failed to create collaboration room: ${response.statusText}`)
      }

      const room: CollaborationRoom = await response.json()

      // Update session with room ID
      const session = await this.getSession(sessionId)
      if (session?.collaborationData) {
        session.collaborationData.roomIds.push(room.roomId)
        session.collaborationData.activeCollaborations++
        session.collaborationData.lastCollaboration = Date.now()
        await this.updateSession(sessionId, session, userId)
      }

      return room
    } catch (error) {
      console.error('Failed to create collaboration room:', error)
      throw error
    }
  }

  /**
   * Join collaboration room
   */
  async joinCollaborationRoom(
    roomId: string,
    _sessionId: string,
    userId?: string,
    token?: string
  ): Promise<string> {
    if (!this.config.collaborationEnabled) {
      throw new Error('Collaboration is disabled')
    }

    try {
      const collaborationRoom = this.env.COLLABORATION_ROOM as DurableObject

      // Create WebSocket connection to room
      const response = await collaborationRoom.fetch(
        new Request(
          `https://dummy-url/websocket?roomId=${roomId}&userId=${userId}&token=${token}`,
          {
            method: 'GET',
            headers: {
              Upgrade: 'websocket',
              Connection: 'Upgrade',
            },
          }
        )
      )

      if (!response.ok) {
        throw new Error(`Failed to join collaboration room: ${response.statusText}`)
      }

      return `wss://${this.env.WEBSOCKET_HOST}/room/${roomId}/websocket`
    } catch (error) {
      console.error('Failed to join collaboration room:', error)
      throw error
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<SessionStats> {
    try {
      const sessionManager = this.env.SESSION_MANAGER as DurableObject
      const response = await sessionManager.fetch(
        new Request('https://dummy-url/stats', {
          method: 'GET',
        })
      )

      if (!response.ok) {
        throw new Error(`Failed to get session stats: ${response.statusText}`)
      }

      const stats = await response.json()

      return {
        totalSessions: stats.totalSessions || 0,
        activeSessions: stats.activeConnections || 0,
        expiredSessions: 0, // Would need additional tracking
        totalConnections: stats.activeConnections || 0,
        averageSessionDuration: stats.metrics?.averageSessionDuration || 0,
        peakConcurrentSessions: stats.metrics?.peakConnections || 0,
        collaborationStats: {
          activeRooms: stats.activeRooms || 0,
          totalParticipants: stats.totalParticipants || 0,
          activeOperations: stats.totalMessages || 0,
        },
      }
    } catch (error) {
      console.error('Failed to get session stats:', error)
      return {
        totalSessions: 0,
        activeSessions: 0,
        expiredSessions: 0,
        totalConnections: 0,
        averageSessionDuration: 0,
        peakConcurrentSessions: 0,
        collaborationStats: {
          activeRooms: 0,
          totalParticipants: 0,
          activeOperations: 0,
        },
      }
    }
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const sessionManager = this.env.SESSION_MANAGER as DurableObject
      const response = await sessionManager.fetch(
        new Request('https://dummy-url/admin/cleanup', {
          method: 'POST',
        })
      )

      if (!response.ok) {
        throw new Error(`Failed to cleanup sessions: ${response.statusText}`)
      }

      const result = await response.json()
      return result.cleanedCount || 0
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error)
      return 0
    }
  }

  /**
   * Validate session token
   */
  async validateSessionToken(token: string, clientIP?: string): Promise<TokenPayload | null> {
    try {
      return await this.authService.verifyToken(token, clientIP)
    } catch (error) {
      console.error('Failed to validate session token:', error)
      return null
    }
  }

  /**
   * Extend session TTL
   */
  async extendSession(sessionId: string, additionalTTL: number, userId?: string): Promise<boolean> {
    const session = await this.getSession(sessionId)
    if (!session) {
      return false
    }

    const newExpiresAt = Math.min(
      session.expiresAt + additionalTTL,
      Date.now() + this.config.maxTTL
    )

    return (await this.updateSession(sessionId, { expiresAt: newExpiresAt }, userId)) !== null
  }

  /**
   * Check session limits for user
   */
  private async checkSessionLimits(userId: string): Promise<void> {
    const userSessions = await this.getUserSessions(userId, {
      activeOnly: true,
    })

    // Get user's session limit from their subscription tier
    const user = await this.authService.getUserById(userId)
    const maxSessions = this.getMaxSessionsForTier(user?.subscription_tier || 'free')

    if (userSessions.length >= maxSessions) {
      throw new Error(`Session limit exceeded for ${user?.subscription_tier || 'free'} tier`)
    }
  }

  /**
   * Get maximum sessions allowed for subscription tier
   */
  private getMaxSessionsForTier(tier: string): number {
    const limits: Record<string, number> = {
      free: 3,
      pro: 10,
      enterprise: 50,
    }
    return limits[tier] || 3
  }

  /**
   * Log session events for audit and analytics
   */
  private async logSessionEvent(event: SessionEvent): Promise<void> {
    if (!this.config.enableAuditLog) return

    try {
      await this.env.ANALYTICS.put(
        `session_event:${event.timestamp}:${Math.random().toString(36).substr(2, 9)}`,
        JSON.stringify(event),
        { expirationTtl: 86400 * 30 } // 30 days
      )
    } catch (error) {
      console.error('Failed to log session event:', error)
    }
  }

  /**
   * Get health status of session service
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    details: Record<string, any>
  }> {
    try {
      const sessionManager = this.env.SESSION_MANAGER as DurableObject
      const response = await sessionManager.fetch(
        new Request('https://dummy-url/health', {
          method: 'GET',
        })
      )

      if (!response.ok) {
        return {
          status: 'unhealthy',
          details: { error: 'Session manager unhealthy' },
        }
      }

      const health = await response.json()

      return {
        status: health.status || 'healthy',
        details: {
          ...health.details,
          sessionService: {
            config: this.config,
            collaborationEnabled: this.config.collaborationEnabled,
          },
        },
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }
}

// Factory function
export function createSessionService(env: Env, config?: Partial<SessionConfig>): SessionService {
  return new SessionService(env, config)
}

export default SessionService
