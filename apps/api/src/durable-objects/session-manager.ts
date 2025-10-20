/**
 * Session Manager Durable Object
 *
 * Provides real-time session management, WebSocket connections,
 * and collaboration features integrated with authentication and rate limiting.
 */

import {
  SessionData,
  SessionMessage,
  DurableObjectHealthCheck,
  DurableObjectConfig,
  getDurableObjectConfig
} from '../config/cloudflare/durable-objects-config'
import { User } from '../models/user'
import { RateLimitService, RateLimitCheck } from '../services/rate_limit_service'

// Enhanced session data with authentication and rate limiting integration
export interface EnhancedSessionData extends SessionData {
  user?: User
  rateLimitData?: {
    apiRequests: number
    lastReset: number
    tier: string
    customLimits?: Record<string, number>
  }
  collaborationData?: {
    roomIds: string[]
    activeCollaborations: number
    lastCollaboration: number
  }
  securityData?: {
    riskScore: number
    suspiciousActivity: Array<{
      type: string
      timestamp: number
      details: any
    }>
    blockedUntil?: number
  }
}

// WebSocket connection with enhanced metadata
export interface EnhancedConnection {
  connectionId: string
  websocket: WebSocket
  userId?: string
  sessionId: string
  connectedAt: number
  lastActivity: number
  lastPing: number
  lastPong: number
  metadata: {
    ipAddress?: string
    userAgent?: string
    origin?: string
    protocol?: string
  }
  subscriptionTier?: string
  rateLimitKey?: string
  isActive: boolean
  rooms: Set<string>
}

// Real-time collaboration room data
export interface CollaborationRoom {
  roomId: string
  name: string
  type: 'document' | 'chat' | 'whiteboard' | 'code'
  ownerId: string
  participants: Array<{
    userId?: string
    connectionId: string
    joinedAt: number
    role: 'owner' | 'editor' | 'viewer'
    permissions: string[]
  }>
  data: Record<string, any>
  createdAt: number
  lastActivity: number
  maxParticipants: number
  isLocked: boolean
  settings: {
    allowAnonymous: boolean
    requireAuth: boolean
    autoSave: boolean
    versionHistory: boolean
  }
}

// Session management events
export interface SessionEvent {
  type: 'session_created' | 'session_updated' | 'session_deleted' |
        'user_connected' | 'user_disconnected' | 'room_created' |
        'room_joined' | 'room_left' | 'room_updated' | 'security_alert'
  sessionId: string
  userId?: string
  connectionId?: string
  roomId?: string
  timestamp: number
  data?: any
}

export class SessionManagerDurableObject {
  private storage: DurableObjectStorage
  private env: Env
  private config: DurableObjectConfig

  // In-memory caches
  private sessions: Map<string, EnhancedSessionData>
  private connections: Map<string, EnhancedConnection>
  private rooms: Map<string, CollaborationRoom>

  // Rate limiting service instance
  private rateLimitService: RateLimitService

  // Health monitoring
  private healthCheckData: DurableObjectHealthCheck | null = null
  private metrics: {
    totalSessionsCreated: number
    totalConnections: number
    totalMessages: number
    totalErrors: number
    averageSessionDuration: number
    peakConnections: number
  }

  constructor(state: DurableObjectState, env: Env) {
    this.storage = state.storage
    this.env = env
    this.config = getDurableObjectConfig('sessionManager', env.ENVIRONMENT)

    // Initialize caches
    this.sessions = new Map()
    this.connections = new Map()
    this.rooms = new Map()

    // Initialize rate limiting service
    this.rateLimitService = new RateLimitService({
      db: env.DB,
      kv: env.CACHE,
      auditEnabled: true,
      enableDistributedLimiting: true
    })

    // Initialize metrics
    this.metrics = {
      totalSessionsCreated: 0,
      totalConnections: 0,
      totalMessages: 0,
      totalErrors: 0,
      averageSessionDuration: 0,
      peakConnections: 0
    }

    // Initialize alarm for cleanup and monitoring
    this.initializeAlarm()
  }

  /**
   * Main fetch handler for the Durable Object
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname.split('/').filter(Boolean)

    try {
      // Route the request
      switch (path[0]) {
        case 'session':
          return this.handleSessionRequest(request, path[1], url.searchParams)

        case 'websocket':
          return this.handleWebSocketRequest(request, url.searchParams)

        case 'room':
          return this.handleRoomRequest(request, path[1], url.searchParams)

        case 'collaboration':
          return this.handleCollaborationRequest(request, path[1], url.searchParams)

        case 'health':
          return this.handleHealthCheck()

        case 'stats':
          return this.handleStatsRequest()

        case 'admin':
          return this.handleAdminRequest(request, path[1])

        default:
          return new Response('Not Found', { status: 404 })
      }
    } catch (error) {
      this.metrics.totalErrors++
      console.error('Session Manager error:', error)

      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now()
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }

  /**
   * Handle session-related requests
   */
  private async handleSessionRequest(
    request: Request,
    sessionId?: string,
    searchParams?: URLSearchParams
  ): Promise<Response> {
    if (!sessionId) {
      return new Response('Session ID required', { status: 400 })
    }

    const userId = searchParams?.get('userId')
    const ipAddress = request.headers.get('CF-Connecting-IP') || 'unknown'
    const userAgent = request.headers.get('User-Agent') || 'unknown'

    switch (request.method) {
      case 'GET':
        const session = await this.getSession(sessionId)
        if (!session) {
          return new Response('Session not found', { status: 404 })
        }

        // Filter sensitive data for non-admin requests
        const filteredSession = this.filterSessionData(session, userId)
        return new Response(JSON.stringify(filteredSession), {
          headers: { 'Content-Type': 'application/json' }
        })

      case 'POST':
        const createData = await request.json()
        const newSession = await this.createSession(
          sessionId,
          userId || undefined,
          createData,
          ipAddress,
          userAgent
        )

        return new Response(JSON.stringify(newSession), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        })

      case 'PUT':
        const updateData = await request.json()
        const updatedSession = await this.updateSession(sessionId, updateData, userId)

        if (!updatedSession) {
          return new Response('Session not found', { status: 404 })
        }

        return new Response(JSON.stringify(updatedSession), {
          headers: { 'Content-Type': 'application/json' }
        })

      case 'DELETE':
        const success = await this.deleteSession(sessionId, userId)
        return new Response(JSON.stringify({ success }), {
          headers: { 'Content-Type': 'application/json' }
        })

      default:
        return new Response('Method Not Allowed', { status: 405 })
    }
  }

  /**
   * Handle WebSocket upgrade requests
   */
  private async handleWebSocketRequest(
    request: Request,
    searchParams?: URLSearchParams
  ): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade')
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected websocket', { status: 426 })
    }

    const sessionId = searchParams?.get('sessionId')
    const userId = searchParams?.get('userId')
    const roomId = searchParams?.get('roomId')
    const token = searchParams?.get('token')

    if (!sessionId) {
      return new Response('Session ID required', { status: 400 })
    }

    // Verify session exists
    const session = await this.getSession(sessionId)
    if (!session) {
      return new Response('Session not found', { status: 404 })
    }

    // Validate token if provided
    if (token && userId) {
      try {
        // Verify JWT token with the auth service
        const authService = new (await import('../services/auth_service')).AuthService({
          db: this.env.DB,
          kv: this.env.SESSIONS,
          jwtSecret: this.env.JWT_SECRET || 'default-secret',
          sessionTimeoutMinutes: 30,
        })

        const payload = await authService.verifyToken(token, request.headers.get('CF-Connecting-IP') || 'unknown')
        if (!payload || payload.sessionId !== sessionId) {
          return new Response('Invalid token', { status: 401 })
        }
      } catch (error) {
        return new Response('Token validation failed', { status: 401 })
      }
    }

    // Create WebSocket pair
    const [client, server] = Object.values(new WebSocketPair())
    server.accept()

    const connectionId = crypto.randomUUID()

    // Create enhanced connection object
    const connection: EnhancedConnection = {
      connectionId,
      websocket: server,
      userId: userId || undefined,
      sessionId,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      lastPing: Date.now(),
      lastPong: Date.now(),
      metadata: {
        ipAddress: request.headers.get('CF-Connecting-IP') || 'unknown',
        userAgent: request.headers.get('User-Agent') || 'unknown',
        origin: request.headers.get('Origin') || 'unknown',
        protocol: server.protocol || 'unknown'
      },
      subscriptionTier: session.user?.subscription_tier || 'free',
      rateLimitKey: this.generateRateLimitKey(sessionId, userId),
      isActive: true,
      rooms: new Set(roomId ? [roomId] : [])
    }

    // Add connection to session
    await this.addConnectionToSession(sessionId, connection)
    this.connections.set(connectionId, connection)

    // Join room if specified
    if (roomId) {
      await this.joinRoom(roomId, connectionId, userId)
    }

    // Set up WebSocket event handlers
    this.setupWebSocketHandlers(connection, sessionId, userId)

    // Send welcome message
    server.send(JSON.stringify({
      type: 'connected',
      connectionId,
      sessionId,
      timestamp: Date.now(),
      features: {
        collaboration: true,
        rateLimiting: true,
        authentication: !!userId
      }
    }))

    // Start ping/pong heartbeat
    this.startHeartbeat(connection)

    this.metrics.totalConnections++
    this.metrics.peakConnections = Math.max(this.metrics.peakConnections, this.connections.size)

    return new Response(null, { status: 101, webSocket: client })
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupWebSocketHandlers(
    connection: EnhancedConnection,
    sessionId: string,
    userId?: string
  ): void {
    const { websocket } = connection

    websocket.addEventListener('message', async (event) => {
      try {
        await this.handleWebSocketMessage(connection, event.data, sessionId, userId)
      } catch (error) {
        console.error('WebSocket message error:', error)
        websocket.send(JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now()
        }))
      }
    })

    websocket.addEventListener('close', async (event) => {
      await this.handleWebSocketClose(connection, sessionId, userId, event)
    })

    websocket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error)
      this.metrics.totalErrors++
    })
  }

  /**
   * Handle incoming WebSocket messages
   */
  private async handleWebSocketMessage(
    connection: EnhancedConnection,
    data: string,
    sessionId: string,
    userId?: string
  ): Promise<void> {
    const message: SessionMessage = JSON.parse(data)
    connection.lastActivity = Date.now()
    this.metrics.totalMessages++

    // Update session activity
    await this.updateSessionActivity(sessionId)

    // Check rate limits for messaging
    if (connection.rateLimitKey) {
      const rateLimitCheck = await this.rateLimitService.checkRateLimit({
        identifier: connection.rateLimitKey,
        quotaType: 'websocket_messages',
        amount: 1,
        customLimit: this.getMessageRateLimit(connection.subscriptionTier)
      })

      if (!rateLimitCheck.allowed) {
        connection.websocket.send(JSON.stringify({
          type: 'rate_limited',
          retryAfter: rateLimitCheck.retryAfter,
          timestamp: Date.now()
        }))
        return
      }
    }

    switch (message.type) {
      case 'data':
        await this.handleDataMessage(connection, message, sessionId, userId)
        break

      case 'heartbeat':
      case 'ping':
        connection.lastPong = Date.now()
        connection.websocket.send(JSON.stringify({
          type: 'pong',
          timestamp: Date.now()
        }))
        break

      case 'join_room':
        await this.handleJoinRoom(connection, message, sessionId, userId)
        break

      case 'leave_room':
        await this.handleLeaveRoom(connection, message, sessionId, userId)
        break

      case 'collaboration':
        await this.handleCollaborationMessage(connection, message, sessionId, userId)
        break

      default:
        console.warn('Unknown message type:', message.type)
    }
  }

  /**
   * Handle data messages (broadcasting)
   */
  private async handleDataMessage(
    connection: EnhancedConnection,
    message: SessionMessage,
    sessionId: string,
    userId?: string
  ): Promise<void> {
    // Enhance message with metadata
    const enhancedMessage = {
      ...message,
      connectionId: connection.connectionId,
      userId,
      timestamp: Date.now(),
      sessionId
    }

    // Broadcast to session or specific rooms
    if (connection.rooms.size > 0) {
      // Send to all rooms the connection is in
      for (const roomId of connection.rooms) {
        await this.broadcastToRoom(roomId, enhancedMessage)
      }
    } else {
      // Broadcast to entire session
      await this.broadcastToSession(sessionId, enhancedMessage, connection.connectionId)
    }

    // Log event for analytics
    await this.logSessionEvent({
      type: 'data_message',
      sessionId,
      userId,
      connectionId: connection.connectionId,
      timestamp: Date.now(),
      data: { messageType: message.data?.type }
    })
  }

  /**
   * Handle room join requests
   */
  private async handleJoinRoom(
    connection: EnhancedConnection,
    message: SessionMessage,
    sessionId: string,
    userId?: string
  ): Promise<void> {
    const roomId = message.data?.roomId
    if (!roomId) {
      connection.websocket.send(JSON.stringify({
        type: 'error',
        error: 'Room ID required',
        timestamp: Date.now()
      }))
      return
    }

    try {
      await this.joinRoom(roomId, connection.connectionId, userId)
      connection.rooms.add(roomId)

      connection.websocket.send(JSON.stringify({
        type: 'room_joined',
        roomId,
        timestamp: Date.now()
      }))
    } catch (error) {
      connection.websocket.send(JSON.stringify({
        type: 'error',
        error: error instanceof Error ? error.message : 'Failed to join room',
        timestamp: Date.now()
      }))
    }
  }

  /**
   * Handle room leave requests
   */
  private async handleLeaveRoom(
    connection: EnhancedConnection,
    message: SessionMessage,
    sessionId: string,
    userId?: string
  ): Promise<void> {
    const roomId = message.data?.roomId
    if (!roomId) {
      connection.websocket.send(JSON.stringify({
        type: 'error',
        error: 'Room ID required',
        timestamp: Date.now()
      }))
      return
    }

    await this.leaveRoom(roomId, connection.connectionId)
    connection.rooms.delete(roomId)

    connection.websocket.send(JSON.stringify({
      type: 'room_left',
      roomId,
      timestamp: Date.now()
    }))
  }

  /**
   * Handle collaboration-specific messages
   */
  private async handleCollaborationMessage(
    connection: EnhancedConnection,
    message: SessionMessage,
    sessionId: string,
    userId?: string
  ): Promise<void> {
    const { roomId, operation, data } = message.data || {}

    if (!roomId) {
      connection.websocket.send(JSON.stringify({
        type: 'error',
        error: 'Room ID required for collaboration',
        timestamp: Date.now()
      }))
      return
    }

    const room = this.rooms.get(roomId)
    if (!room) {
      connection.websocket.send(JSON.stringify({
        type: 'error',
        error: 'Room not found',
        timestamp: Date.now()
      }))
      return
    }

    // Check if user has permission to perform operation
    const participant = room.participants.find(p => p.connectionId === connection.connectionId)
    if (!participant || !this.hasPermission(participant, operation)) {
      connection.websocket.send(JSON.stringify({
        type: 'error',
        error: 'Insufficient permissions',
        timestamp: Date.now()
      }))
      return
    }

    // Apply operation and broadcast to room
    const collaborationMessage = {
      type: 'collaboration_update',
      roomId,
      operation,
      data,
      userId,
      connectionId: connection.connectionId,
      timestamp: Date.now()
    }

    // Update room data (simplified)
    this.applyRoomOperation(room, operation, data)
    await this.storage.put(`room:${roomId}`, room)

    // Broadcast to other room participants
    await this.broadcastToRoom(roomId, collaborationMessage, connection.connectionId)
  }

  /**
   * Handle WebSocket close events
   */
  private async handleWebSocketClose(
    connection: EnhancedConnection,
    sessionId: string,
    userId?: string,
    event?: CloseEvent
  ): Promise<void> {
    connection.isActive = false

    // Leave all rooms
    for (const roomId of connection.rooms) {
      await this.leaveRoom(roomId, connection.connectionId)
    }

    // Remove connection from session
    await this.removeConnectionFromSession(sessionId, connection.connectionId)
    this.connections.delete(connection.connectionId)

    // Log event
    await this.logSessionEvent({
      type: 'user_disconnected',
      sessionId,
      userId,
      connectionId: connection.connectionId,
      timestamp: Date.now(),
      data: { code: event?.code, reason: event?.reason }
    })
  }

  /**
   * Start heartbeat for connection monitoring
   */
  private startHeartbeat(connection: EnhancedConnection): void {
    const heartbeatInterval = setInterval(() => {
      if (!connection.isActive) {
        clearInterval(heartbeatInterval)
        return
      }

      const now = Date.now()

      // Check if connection is stale (no pong for 60 seconds)
      if (now - connection.lastPong > 60000) {
        connection.websocket.close(1000, 'Connection stale')
        clearInterval(heartbeatInterval)
        return
      }

      // Send ping
      if (connection.websocket.readyState === WebSocket.OPEN) {
        connection.websocket.send(JSON.stringify({
          type: 'ping',
          timestamp: now
        }))
        connection.lastPing = now
      } else {
        clearInterval(heartbeatInterval)
      }
    }, 30000) // Every 30 seconds
  }

  /**
   * Session management methods
   */
  private async createSession(
    sessionId: string,
    userId?: string,
    data: any = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<EnhancedSessionData> {
    const now = Date.now()
    const ttl = data.ttl || 86400000 // 24 hours default

    // Get user data if userId provided
    let user: User | undefined
    if (userId) {
      try {
        const userService = new (await import('../services/user_service')).UserService(this.env.DB)
        user = await userService.findById(userId)
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      }
    }

    const session: EnhancedSessionData = {
      sessionId,
      userId,
      ipAddress,
      userAgent,
      data: data.sessionData || {},
      connections: [],
      createdAt: now,
      lastAccessed: now,
      expiresAt: now + ttl,
      metadata: data.metadata,
      user,
      rateLimitData: {
        apiRequests: 0,
        lastReset: now,
        tier: user?.subscription_tier || 'free',
        customLimits: data.customLimits
      },
      collaborationData: {
        roomIds: [],
        activeCollaborations: 0,
        lastCollaboration: now
      },
      securityData: {
        riskScore: 0,
        suspiciousActivity: []
      }
    }

    await this.storage.put(`session:${sessionId}`, session)
    this.sessions.set(sessionId, session)
    this.metrics.totalSessionsCreated++

    await this.logSessionEvent({
      type: 'session_created',
      sessionId,
      userId,
      timestamp: now,
      data: { ttl, tier: session.rateLimitData?.tier }
    })

    return session
  }

  private async getSession(sessionId: string): Promise<EnhancedSessionData | null> {
    // Check memory cache first
    let session = this.sessions.get(sessionId)

    if (!session) {
      // Load from storage
      session = await this.storage.get(`session:${sessionId}`)
      if (session) {
        this.sessions.set(sessionId, session)
      }
    }

    // Check if session is expired
    if (session && Date.now() > session.expiresAt) {
      await this.deleteSession(sessionId)
      return null
    }

    return session || null
  }

  private async updateSession(
    sessionId: string,
    updates: any,
    userId?: string
  ): Promise<EnhancedSessionData | null> {
    const session = await this.getSession(sessionId)
    if (!session) return null

    // Verify user has permission to update session
    if (userId && session.userId !== userId) {
      throw new Error('Unauthorized to update session')
    }

    const updatedSession: EnhancedSessionData = {
      ...session,
      ...updates,
      lastAccessed: Date.now(),
    }

    await this.storage.put(`session:${sessionId}`, updatedSession)
    this.sessions.set(sessionId, updatedSession)

    await this.logSessionEvent({
      type: 'session_updated',
      sessionId,
      userId,
      timestamp: Date.now(),
      data: { updatedFields: Object.keys(updates) }
    })

    return updatedSession
  }

  private async deleteSession(
    sessionId: string,
    userId?: string
  ): Promise<boolean> {
    const session = await this.getSession(sessionId)
    if (!session) return false

    // Verify user has permission to delete session
    if (userId && session.userId !== userId) {
      throw new Error('Unauthorized to delete session')
    }

    // Close all connections
    for (const connectionData of session.connections) {
      const connection = this.connections.get(connectionData.connectionId)
      if (connection && connection.isActive) {
        connection.websocket.close(1000, 'Session deleted')
      }
      this.connections.delete(connectionData.connectionId)
    }

    // Leave all collaboration rooms
    if (session.collaborationData?.roomIds) {
      for (const roomId of session.collaborationData.roomIds) {
        const room = this.rooms.get(roomId)
        if (room) {
          room.participants = room.participants.filter(
            p => !session.connections.some(c => c.connectionId === p.connectionId)
          )
          await this.storage.put(`room:${roomId}`, room)
        }
      }
    }

    // Delete from storage and memory
    await this.storage.delete(`session:${sessionId}`)
    this.sessions.delete(sessionId)

    await this.logSessionEvent({
      type: 'session_deleted',
      sessionId,
      userId,
      timestamp: Date.now()
    })

    return true
  }

  private async updateSessionActivity(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) return

    session.lastAccessed = Date.now()
    await this.storage.put(`session:${sessionId}`, session)
    this.sessions.set(sessionId, session)
  }

  /**
   * Connection management methods
   */
  private async addConnectionToSession(
    sessionId: string,
    connection: EnhancedConnection
  ): Promise<void> {
    let session = await this.getSession(sessionId)

    if (!session) {
      // Create session if it doesn't exist
      session = await this.createSession(sessionId, connection.userId, {
        ipAddress: connection.metadata.ipAddress,
        userAgent: connection.metadata.userAgent
      })
    }

    const connectionData = {
      connectionId: connection.connectionId,
      connectedAt: connection.connectedAt,
      lastActivity: connection.lastActivity,
      metadata: connection.metadata
    }

    session.connections.push(connectionData)
    session.lastAccessed = Date.now()

    await this.storage.put(`session:${sessionId}`, session)
    this.sessions.set(sessionId, session)

    // Notify other connections in session
    await this.broadcastToSession(sessionId, {
      type: 'data',
      data: { type: 'user_joined', connectionId: connection.connectionId },
      connectionId: connection.connectionId,
      timestamp: Date.now()
    }, connection.connectionId)

    await this.logSessionEvent({
      type: 'user_connected',
      sessionId,
      userId: connection.userId,
      connectionId: connection.connectionId,
      timestamp: Date.now()
    })
  }

  private async removeConnectionFromSession(
    sessionId: string,
    connectionId: string
  ): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) return

    session.connections = session.connections.filter(
      c => c.connectionId !== connectionId
    )
    session.lastAccessed = Date.now()

    // Delete session if no connections left and not persistent
    if (session.connections.length === 0 && !session.metadata?.persistent) {
      await this.deleteSession(sessionId)
      return
    }

    await this.storage.put(`session:${sessionId}`, session)
    this.sessions.set(sessionId, session)

    // Notify other connections in session
    await this.broadcastToSession(sessionId, {
      type: 'data',
      data: { type: 'user_left', connectionId },
      timestamp: Date.now()
    }, connectionId)
  }

  /**
   * Room management methods
   */
  private async handleRoomRequest(
    request: Request,
    roomId?: string,
    searchParams?: URLSearchParams
  ): Promise<Response> {
    if (!roomId) {
      return new Response('Room ID required', { status: 400 })
    }

    switch (request.method) {
      case 'GET':
        const room = this.rooms.get(roomId) || await this.storage.get(`room:${roomId}`)
        if (!room) {
          return new Response('Room not found', { status: 404 })
        }
        return new Response(JSON.stringify(room), {
          headers: { 'Content-Type': 'application/json' }
        })

      case 'POST':
        const createData = await request.json()
        const newRoom = await this.createRoom(roomId, createData)
        return new Response(JSON.stringify(newRoom), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        })

      case 'PUT':
        const updateData = await request.json()
        const updatedRoom = await this.updateRoom(roomId, updateData)
        if (!updatedRoom) {
          return new Response('Room not found', { status: 404 })
        }
        return new Response(JSON.stringify(updatedRoom), {
          headers: { 'Content-Type': 'application/json' }
        })

      case 'DELETE':
        const success = await this.deleteRoom(roomId)
        return new Response(JSON.stringify({ success }), {
          headers: { 'Content-Type': 'application/json' }
        })

      default:
        return new Response('Method Not Allowed', { status: 405 })
    }
  }

  private async createRoom(roomId: string, data: any): Promise<CollaborationRoom> {
    const room: CollaborationRoom = {
      roomId,
      name: data.name || roomId,
      type: data.type || 'document',
      ownerId: data.ownerId,
      participants: [],
      data: data.initialData || {},
      createdAt: Date.now(),
      lastActivity: Date.now(),
      maxParticipants: data.maxParticipants || 10,
      isLocked: false,
      settings: {
        allowAnonymous: data.allowAnonymous || false,
        requireAuth: data.requireAuth || true,
        autoSave: data.autoSave !== false,
        versionHistory: data.versionHistory !== false
      }
    }

    this.rooms.set(roomId, room)
    await this.storage.put(`room:${roomId}`, room)

    await this.logSessionEvent({
      type: 'room_created',
      sessionId: '', // Room events are not tied to specific sessions
      userId: data.ownerId,
      roomId,
      timestamp: Date.now(),
      data: { type: room.type, maxParticipants: room.maxParticipants }
    })

    return room
  }

  private async updateRoom(roomId: string, updates: any): Promise<CollaborationRoom | null> {
    let room = this.rooms.get(roomId) || await this.storage.get(`room:${roomId}`)
    if (!room) return null

    const updatedRoom = { ...room, ...updates, lastActivity: Date.now() }
    this.rooms.set(roomId, updatedRoom)
    await this.storage.put(`room:${roomId}`, updatedRoom)

    await this.logSessionEvent({
      type: 'room_updated',
      sessionId: '',
      roomId,
      timestamp: Date.now(),
      data: { updatedFields: Object.keys(updates) }
    })

    return updatedRoom
  }

  private async deleteRoom(roomId: string): Promise<boolean> {
    const room = this.rooms.get(roomId) || await this.storage.get(`room:${roomId}`)
    if (!room) return false

    // Remove all participants
    for (const participant of room.participants) {
      const connection = this.connections.get(participant.connectionId)
      if (connection) {
        connection.rooms.delete(roomId)
        connection.websocket.send(JSON.stringify({
          type: 'room_deleted',
          roomId,
          timestamp: Date.now()
        }))
      }
    }

    this.rooms.delete(roomId)
    await this.storage.delete(`room:${roomId}`)

    await this.logSessionEvent({
      type: 'room_deleted',
      sessionId: '',
      roomId,
      timestamp: Date.now()
    })

    return true
  }

  private async joinRoom(
    roomId: string,
    connectionId: string,
    userId?: string
  ): Promise<void> {
    let room = this.rooms.get(roomId) || await this.storage.get(`room:${roomId}`)
    if (!room) {
      throw new Error('Room not found')
    }

    // Check if room is full
    if (room.participants.length >= room.maxParticipants) {
      throw new Error('Room is full')
    }

    // Check if user is already in room
    if (room.participants.some(p => p.connectionId === connectionId)) {
      return
    }

    // Add participant
    const participant = {
      userId,
      connectionId,
      joinedAt: Date.now(),
      role: userId === room.ownerId ? 'owner' : 'editor',
      permissions: this.getDefaultPermissions(room.type, 'editor')
    }

    room.participants.push(participant)
    room.lastActivity = Date.now()

    this.rooms.set(roomId, room)
    await this.storage.put(`room:${roomId}`, room)

    // Notify other participants
    await this.broadcastToRoom(roomId, {
      type: 'user_joined',
      roomId,
      userId,
      connectionId,
      timestamp: Date.now()
    }, connectionId)

    await this.logSessionEvent({
      type: 'room_joined',
      sessionId: '',
      userId,
      roomId,
      connectionId,
      timestamp: Date.now()
    })
  }

  private async leaveRoom(
    roomId: string,
    connectionId: string
  ): Promise<void> {
    const room = this.rooms.get(roomId) || await this.storage.get(`room:${roomId}`)
    if (!room) return

    room.participants = room.participants.filter(p => p.connectionId !== connectionId)
    room.lastActivity = Date.now()

    // Delete room if empty and not persistent
    if (room.participants.length === 0) {
      await this.deleteRoom(roomId)
      return
    }

    this.rooms.set(roomId, room)
    await this.storage.put(`room:${roomId}`, room)

    // Notify other participants
    await this.broadcastToRoom(roomId, {
      type: 'user_left',
      roomId,
      connectionId,
      timestamp: Date.now()
    })

    await this.logSessionEvent({
      type: 'room_left',
      sessionId: '',
      roomId,
      connectionId,
      timestamp: Date.now()
    })
  }

  /**
   * Collaboration request handler
   */
  private async handleCollaborationRequest(
    request: Request,
    action?: string,
    searchParams?: URLSearchParams
  ): Promise<Response> {
    if (!action) {
      return new Response('Action required', { status: 400 })
    }

    switch (action) {
      case 'list-rooms':
        const userId = searchParams?.get('userId')
        const rooms = await this.listUserRooms(userId)
        return new Response(JSON.stringify({ rooms }), {
          headers: { 'Content-Type': 'application/json' }
        })

      case 'room-history':
        const roomId = searchParams?.get('roomId')
        const history = await this.getRoomHistory(roomId)
        return new Response(JSON.stringify({ history }), {
          headers: { 'Content-Type': 'application/json' }
        })

      default:
        return new Response('Invalid action', { status: 400 })
    }
  }

  /**
   * Broadcasting methods
   */
  private async broadcastToSession(
    sessionId: string,
    message: any,
    excludeConnectionId?: string
  ): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) return

    const messageStr = JSON.stringify(message)

    for (const connectionData of session.connections) {
      if (connectionData.connectionId === excludeConnectionId) continue

      const connection = this.connections.get(connectionData.connectionId)
      if (connection && connection.isActive && connection.websocket.readyState === WebSocket.OPEN) {
        try {
          connection.websocket.send(messageStr)
        } catch (error) {
          console.error('Failed to send message to connection:', error)
          // Mark connection as inactive
          connection.isActive = false
        }
      }
    }
  }

  private async broadcastToRoom(
    roomId: string,
    message: any,
    excludeConnectionId?: string
  ): Promise<void> {
    const room = this.rooms.get(roomId)
    if (!room) return

    const messageStr = JSON.stringify(message)

    for (const participant of room.participants) {
      if (participant.connectionId === excludeConnectionId) continue

      const connection = this.connections.get(participant.connectionId)
      if (connection && connection.isActive && connection.websocket.readyState === WebSocket.OPEN) {
        try {
          connection.websocket.send(messageStr)
        } catch (error) {
          console.error('Failed to send message to room participant:', error)
          connection.isActive = false
        }
      }
    }
  }

  /**
   * Health check and stats methods
   */
  private async handleHealthCheck(): Promise<Response> {
    const startTime = Date.now()

    try {
      const activeConnections = Array.from(this.connections.values()).filter(c => c.isActive).length
      const totalSessions = this.sessions.size
      const activeRooms = this.rooms.size

      // Calculate storage usage (simplified)
      const storageKeys = await this.storage.list()
      const storageUsage = storageKeys.keys.length * 1024 // Rough estimate

      this.healthCheckData = {
        status: 'healthy',
        timestamp: Date.now(),
        instanceId: 'session-manager',
        responseTime: Date.now() - startTime,
        details: {
          activeConnections,
          totalSessions,
          activeRooms,
          memoryUsage: 0, // Would need actual memory monitoring
          storageUsage,
          cpuUsage: 0, // Would need actual CPU monitoring
          ...this.metrics
        }
      }

      return new Response(JSON.stringify(this.healthCheckData), {
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error) {
      this.healthCheckData = {
        status: 'unhealthy',
        timestamp: Date.now(),
        instanceId: 'session-manager',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }

      return new Response(JSON.stringify(this.healthCheckData), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  private async handleStatsRequest(): Promise<Response> {
    const stats = {
      activeConnections: Array.from(this.connections.values()).filter(c => c.isActive).length,
      totalSessions: this.sessions.size,
      activeRooms: this.rooms.size,
      storageKeys: (await this.storage.list()).keys.length,
      uptime: Date.now(), // Would need actual uptime tracking
      healthCheck: this.healthCheckData,
      metrics: this.metrics,
      rateLimitStats: await this.getRateLimitStats()
    }

    return new Response(JSON.stringify(stats), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  private async handleAdminRequest(
    request: Request,
    action?: string
  ): Promise<Response> {
    if (!action) {
      return new Response('Action required', { status: 400 })
    }

    // TODO: Add admin authentication
    switch (action) {
      case 'cleanup':
        await this.cleanupExpiredSessions()
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        })

      case 'force-disconnect':
        const connectionId = new URL(request.url).searchParams.get('connectionId')
        if (connectionId) {
          await this.forceDisconnect(connectionId)
          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
          })
        }
        return new Response('Connection ID required', { status: 400 })

      default:
        return new Response('Invalid action', { status: 400 })
    }
  }

  /**
   * Alarm handler for cleanup and maintenance
   */
  async alarm(): Promise<void> {
    try {
      await this.cleanupExpiredSessions()
      await this.cleanupInactiveConnections()
      await this.updateMetrics()

      // Schedule next alarm
      await this.storage.setAlarm(Date.now() + 300000) // 5 minutes
    } catch (error) {
      console.error('Alarm error:', error)
    }
  }

  /**
   * Cleanup methods
   */
  private async cleanupExpiredSessions(): Promise<void> {
    const now = Date.now()
    const expiredSessions: string[] = []

    for (const [sessionId, session] of this.sessions) {
      if (now > session.expiresAt) {
        expiredSessions.push(sessionId)
      }
    }

    for (const sessionId of expiredSessions) {
      await this.deleteSession(sessionId)
    }

    if (expiredSessions.length > 0) {
      console.log(`Cleaned up ${expiredSessions.length} expired sessions`)
    }
  }

  private async cleanupInactiveConnections(): Promise<void> {
    const now = Date.now()
    const inactiveConnections: string[] = []
    const inactiveThreshold = 300000 // 5 minutes

    for (const [connectionId, connection] of this.connections) {
      if (!connection.isActive || (now - connection.lastActivity > inactiveThreshold)) {
        inactiveConnections.push(connectionId)
      }
    }

    for (const connectionId of inactiveConnections) {
      const connection = this.connections.get(connectionId)
      if (connection) {
        connection.websocket.close(1000, 'Connection inactive')
        this.connections.delete(connectionId)
      }
    }

    if (inactiveConnections.length > 0) {
      console.log(`Cleaned up ${inactiveConnections.length} inactive connections`)
    }
  }

  private async forceDisconnect(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.websocket.close(1000, 'Disconnected by admin')
      this.connections.delete(connectionId)
    }
  }

  /**
   * Utility methods
   */
  private generateRateLimitKey(sessionId: string, userId?: string): string {
    return userId ? `session:${userId}` : `session:anonymous:${sessionId}`
  }

  private getMessageRateLimit(tier?: string): number {
    const limits: Record<string, number> = {
      free: 60,      // 1 message per second
      pro: 600,      // 10 messages per second
      enterprise: 6000 // 100 messages per second
    }
    return limits[tier || 'free'] || 60
  }

  private filterSessionData(session: EnhancedSessionData, requestUserId?: string): EnhancedSessionData {
    // Remove sensitive data for non-owners
    if (requestUserId !== session.userId) {
      const filtered = { ...session }
      delete filtered.securityData
      delete filtered.rateLimitData
      return filtered
    }
    return session
  }

  private hasPermission(participant: any, operation: string): boolean {
    // Simple permission check - can be enhanced
    if (participant.role === 'owner') return true
    if (participant.role === 'editor') return !operation.startsWith('admin.')
    if (participant.role === 'viewer') return operation.startsWith('view.')
    return false
  }

  private getDefaultPermissions(roomType: string, role: string): string[] {
    const permissions: Record<string, Record<string, string[]>> = {
      document: {
        owner: ['read', 'write', 'admin', 'share', 'delete'],
        editor: ['read', 'write', 'share'],
        viewer: ['read']
      },
      chat: {
        owner: ['read', 'write', 'admin', 'delete', 'ban'],
        editor: ['read', 'write'],
        viewer: ['read']
      },
      whiteboard: {
        owner: ['read', 'write', 'admin', 'share', 'delete'],
        editor: ['read', 'write'],
        viewer: ['read']
      },
      code: {
        owner: ['read', 'write', 'admin', 'execute', 'share'],
        editor: ['read', 'write', 'execute'],
        viewer: ['read']
      }
    }

    return permissions[roomType]?.[role] || ['read']
  }

  private applyRoomOperation(room: CollaborationRoom, operation: string, data: any): void {
    // Simplified operation application - would be more sophisticated in production
    switch (operation) {
      case 'update_data':
        room.data = { ...room.data, ...data }
        break
      case 'append_data':
        if (Array.isArray(room.data)) {
          room.data.push(data)
        }
        break
      case 'clear_data':
        room.data = {}
        break
      default:
        console.warn('Unknown room operation:', operation)
    }
  }

  private async listUserRooms(userId?: string): Promise<CollaborationRoom[]> {
    if (!userId) return []

    const userRooms: CollaborationRoom[] = []
    for (const room of this.rooms.values()) {
      if (room.participants.some(p => p.userId === userId)) {
        userRooms.push(room)
      }
    }

    return userRooms
  }

  private async getRoomHistory(roomId?: string): Promise<any[]> {
    if (!roomId) return []

    // TODO: Implement room history from storage
    return []
  }

  private async getRateLimitStats(): Promise<any> {
    // TODO: Implement rate limit statistics
    return {
      totalChecks: 0,
      blockedRequests: 0,
      averageResponseTime: 0
    }
  }

  private async updateMetrics(): Promise<void> {
    // Update average session duration
    const now = Date.now()
    let totalDuration = 0
    let sessionCount = 0

    for (const session of this.sessions.values()) {
      totalDuration += now - session.createdAt
      sessionCount++
    }

    if (sessionCount > 0) {
      this.metrics.averageSessionDuration = totalDuration / sessionCount
    }
  }

  private async initializeAlarm(): Promise<void> {
    if (this.config.enableAlarm) {
      const currentAlarm = await this.storage.getAlarm()
      if (!currentAlarm) {
        // Set alarm to run every 5 minutes for cleanup
        await this.storage.setAlarm(Date.now() + 300000)
      }
    }
  }

  private async logSessionEvent(event: SessionEvent): Promise<void> {
    try {
      // Store in analytics for monitoring
      await this.storage.put(
        `event:${event.timestamp}:${Math.random().toString(36).substr(2, 9)}`,
        event
      )
    } catch (error) {
      console.error('Failed to log session event:', error)
    }
  }
}

// Factory function for creating Session Manager Durable Object instances
export function createSessionManagerDurableObject(
  state: DurableObjectState,
  env: Env
): SessionManagerDurableObject {
  return new SessionManagerDurableObject(state, env)
}

// Export the class for use in worker
export default SessionManagerDurableObject
