/**
 * Cloudflare Durable Objects Configuration
 *
 * This module provides configuration and utilities for Cloudflare Durable Objects,
 * primarily used for real-time session management, collaboration features,
 * and stateful WebSocket connections.
 */

export interface DurableObjectConfig {
  className: string
  scriptName?: string
  binding: string
  maxInstances?: number
  maxMemoryPerInstance?: number
  maxCpuPerInstance?: number
  enableAlarm?: boolean
  enableDurableStorage?: boolean
  maxStorageSize?: number
  enableAutoScaling?: boolean
  healthCheckInterval?: number
  idleTimeout?: number
  maxConnections?: number
}

export interface DurableObjectEnvironmentConfig {
  development: Record<string, DurableObjectConfig>
  production: Record<string, DurableObjectConfig>
  staging?: Record<string, DurableObjectConfig>
}

export const DEFAULT_DURABLE_OBJECT_CONFIG: Partial<DurableObjectConfig> = {
  maxInstances: 100,
  maxMemoryPerInstance: 128, // MB
  maxCpuPerInstance: 1,
  enableAlarm: true,
  enableDurableStorage: true,
  maxStorageSize: 128 * 1024 * 1024, // 128MB
  enableAutoScaling: true,
  healthCheckInterval: 30000, // 30 seconds
  idleTimeout: 300000, // 5 minutes
  maxConnections: 1000,
}

export const DURABLE_OBJECT_ENVIRONMENT_CONFIG: DurableObjectEnvironmentConfig =
  {
    development: {
      sessionManager: {
        className: 'SessionManagerDurableObject',
        binding: 'SESSION_MANAGER',
        maxInstances: 10,
        maxMemoryPerInstance: 64,
        maxConnections: 100,
        idleTimeout: 60000, // 1 minute for development
        ...DEFAULT_DURABLE_OBJECT_CONFIG,
      },
      collaborationRoom: {
        className: 'CollaborationRoomDurableObject',
        binding: 'COLLABORATION_ROOM',
        maxInstances: 20,
        maxMemoryPerInstance: 32,
        maxConnections: 50,
        ...DEFAULT_DURABLE_OBJECT_CONFIG,
      },
      realtimeSync: {
        className: 'RealtimeSyncDurableObject',
        binding: 'REALTIME_SYNC',
        maxInstances: 15,
        maxMemoryPerInstance: 64,
        maxConnections: 200,
        ...DEFAULT_DURABLE_OBJECT_CONFIG,
      },
    },
    production: {
      sessionManager: {
        className: 'SessionManagerDurableObject',
        binding: 'SESSION_MANAGER',
        maxInstances: 1000,
        maxMemoryPerInstance: 256,
        maxConnections: 10000,
        enableAutoScaling: true,
        ...DEFAULT_DURABLE_OBJECT_CONFIG,
      },
      collaborationRoom: {
        className: 'CollaborationRoomDurableObject',
        binding: 'COLLABORATION_ROOM',
        maxInstances: 5000,
        maxMemoryPerInstance: 128,
        maxConnections: 50000,
        enableAutoScaling: true,
        ...DEFAULT_DURABLE_OBJECT_CONFIG,
      },
      realtimeSync: {
        className: 'RealtimeSyncDurableObject',
        binding: 'REALTIME_SYNC',
        maxInstances: 2000,
        maxMemoryPerInstance: 192,
        maxConnections: 20000,
        enableAutoScaling: true,
        ...DEFAULT_DURABLE_OBJECT_CONFIG,
      },
    },
  }

export function getDurableObjectConfig(
  objectName: string,
  environment?: string
): DurableObjectConfig {
  const env = environment || process.env.ENVIRONMENT || 'development'
  const config =
    DURABLE_OBJECT_ENVIRONMENT_CONFIG[
      env as keyof DurableObjectEnvironmentConfig
    ]

  if (!config || !config[objectName]) {
    throw new Error(
      `Durable Object configuration not found for ${objectName} in ${env}`
    )
  }

  return config[objectName]
}

// Session Management Interfaces
export interface SessionData {
  sessionId: string
  userId?: string
  ipAddress?: string
  userAgent?: string
  data: Record<string, any>
  connections: Array<{
    connectionId: string
    connectedAt: number
    lastActivity: number
    metadata?: Record<string, any>
  }>
  createdAt: number
  lastAccessed: number
  expiresAt: number
  metadata?: Record<string, any>
}

export interface SessionMessage {
  type: 'data' | 'heartbeat' | 'disconnect' | 'error'
  sessionId?: string
  connectionId?: string
  data?: any
  timestamp: number
}

export interface DurableObjectHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: number
  instanceId: string
  responseTime: number
  error?: string
  details?: {
    activeConnections: number
    totalSessions: number
    memoryUsage: number
    storageUsage: number
    cpuUsage: number
  }
}

// Session Manager Durable Object
export class SessionManagerDurableObject {
  private sessions: Map<string, SessionData>
  private connections: Map<string, WebSocket>
  private storage: DurableObjectStorage
  private config: DurableObjectConfig
  private healthCheckData: DurableObjectHealthCheck | null = null

  constructor(state: DurableObjectState, env: any) {
    this.storage = state.storage
    this.sessions = new Map()
    this.connections = new Map()
    this.config = getDurableObjectConfig('sessionManager', env.ENVIRONMENT)

    // Initialize alarm for cleanup
    this.initializeAlarm()
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

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname.split('/').filter(Boolean)

    try {
      switch (path[0]) {
        case 'session':
          return this.handleSessionRequest(request, path[1])
        case 'websocket':
          return this.handleWebSocketRequest(request)
        case 'health':
          return this.handleHealthCheck()
        case 'stats':
          return this.handleStatsRequest()
        default:
          return new Response('Not Found', { status: 404 })
      }
    } catch (error) {
      console.error('Session Manager error:', error)
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  private async handleSessionRequest(
    request: Request,
    sessionId?: string
  ): Promise<Response> {
    if (!sessionId) {
      return new Response('Session ID required', { status: 400 })
    }

    if (request.method === 'GET') {
      const session = await this.getSession(sessionId)
      if (!session) {
        return new Response('Session not found', { status: 404 })
      }

      return new Response(JSON.stringify(session), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (request.method === 'POST') {
      const data = await request.json()
      const session = await this.createSession(sessionId, data)

      return new Response(JSON.stringify(session), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (request.method === 'PUT') {
      const data = await request.json()
      const session = await this.updateSession(sessionId, data)

      if (!session) {
        return new Response('Session not found', { status: 404 })
      }

      return new Response(JSON.stringify(session), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (request.method === 'DELETE') {
      const success = await this.deleteSession(sessionId)

      return new Response(JSON.stringify({ success }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response('Method Not Allowed', { status: 405 })
  }

  private async handleWebSocketRequest(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade')
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected websocket', { status: 426 })
    }

    const [client, server] = Object.values(new WebSocketPair())
    server.accept()

    const sessionId = new URL(request.url).searchParams.get('sessionId')
    const connectionId = crypto.randomUUID()

    if (!sessionId) {
      server.close(1008, 'Session ID required')
      return new Response(null, { status: 400 })
    }

    // Add connection to session
    await this.addConnectionToSession(sessionId, connectionId, server)
    this.connections.set(connectionId, server)

    // Handle WebSocket events
    server.addEventListener('message', async event => {
      try {
        const message: SessionMessage = JSON.parse(event.data)
        await this.handleSessionMessage(sessionId, connectionId, message)
      } catch (error) {
        console.error('WebSocket message error:', error)
        server.send(
          JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now(),
          })
        )
      }
    })

    server.addEventListener('close', async () => {
      await this.removeConnectionFromSession(sessionId, connectionId)
      this.connections.delete(connectionId)
    })

    server.addEventListener('error', error => {
      console.error('WebSocket error:', error)
    })

    // Send heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      if (server.readyState === WebSocket.OPEN) {
        server.send(
          JSON.stringify({
            type: 'heartbeat',
            timestamp: Date.now(),
          })
        )
      } else {
        clearInterval(heartbeatInterval)
      }
    }, 30000)

    return new Response(null, { status: 101, webSocket: client })
  }

  private async handleSessionMessage(
    sessionId: string,
    connectionId: string,
    message: SessionMessage
  ): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) return

    // Update last activity
    session.lastAccessed = Date.now()
    const connection = session.connections.find(
      c => c.connectionId === connectionId
    )
    if (connection) {
      connection.lastActivity = Date.now()
    }

    await this.storage.put(`session:${sessionId}`, session)

    // Handle different message types
    switch (message.type) {
      case 'data':
        // Broadcast to all connections in the session
        await this.broadcastToSession(sessionId, {
          ...message,
          connectionId,
          timestamp: Date.now(),
        })
        break

      case 'heartbeat':
        // Update connection activity
        if (connection) {
          connection.lastActivity = Date.now()
        }
        break

      case 'disconnect':
        // Handle graceful disconnect
        await this.removeConnectionFromSession(sessionId, connectionId)
        break
    }
  }

  private async broadcastToSession(
    sessionId: string,
    message: SessionMessage
  ): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) return

    const messageStr = JSON.stringify(message)

    for (const connection of session.connections) {
      const ws = this.connections.get(connection.connectionId)
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr)
        } catch (error) {
          console.error('Failed to send message to connection:', error)
        }
      }
    }
  }

  private async createSession(
    sessionId: string,
    data: any
  ): Promise<SessionData> {
    const session: SessionData = {
      sessionId,
      userId: data.userId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      data: data.sessionData || {},
      connections: [],
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      expiresAt: Date.now() + (data.ttl || 86400000), // 24 hours default
      metadata: data.metadata,
    }

    await this.storage.put(`session:${sessionId}`, session)
    this.sessions.set(sessionId, session)

    return session
  }

  private async getSession(sessionId: string): Promise<SessionData | null> {
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
    updates: any
  ): Promise<SessionData | null> {
    const session = await this.getSession(sessionId)
    if (!session) return null

    const updatedSession: SessionData = {
      ...session,
      ...updates,
      lastAccessed: Date.now(),
    }

    await this.storage.put(`session:${sessionId}`, updatedSession)
    this.sessions.set(sessionId, updatedSession)

    return updatedSession
  }

  private async deleteSession(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId)
    if (!session) return false

    // Close all connections
    for (const connection of session.connections) {
      const ws = this.connections.get(connection.connectionId)
      if (ws) {
        ws.close(1000, 'Session deleted')
        this.connections.delete(connection.connectionId)
      }
    }

    // Delete from storage and memory
    await this.storage.delete(`session:${sessionId}`)
    this.sessions.delete(sessionId)

    return true
  }

  private async addConnectionToSession(
    sessionId: string,
    connectionId: string,
    websocket: WebSocket
  ): Promise<void> {
    let session = await this.getSession(sessionId)

    if (!session) {
      // Create session if it doesn't exist
      session = await this.createSession(sessionId, {})
    }

    const connection = {
      connectionId,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      metadata: {
        userAgent: websocket.protocol || 'unknown',
      },
    }

    session.connections.push(connection)
    session.lastAccessed = Date.now()

    await this.storage.put(`session:${sessionId}`, session)
    this.sessions.set(sessionId, session)

    // Notify other connections
    await this.broadcastToSession(sessionId, {
      type: 'data',
      data: { type: 'user_joined', connectionId },
      timestamp: Date.now(),
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

    // Delete session if no connections left
    if (session.connections.length === 0) {
      await this.deleteSession(sessionId)
      return
    }

    await this.storage.put(`session:${sessionId}`, session)
    this.sessions.set(sessionId, session)

    // Notify other connections
    await this.broadcastToSession(sessionId, {
      type: 'data',
      data: { type: 'user_left', connectionId },
      timestamp: Date.now(),
    })
  }

  private async handleHealthCheck(): Promise<Response> {
    const startTime = Date.now()

    try {
      const activeConnections = this.connections.size
      const totalSessions = this.sessions.size

      // Get storage stats (simplified)
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
          memoryUsage: 0, // Would need actual memory monitoring
          storageUsage,
          cpuUsage: 0, // Would need actual CPU monitoring
        },
      }

      return new Response(JSON.stringify(this.healthCheckData), {
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      this.healthCheckData = {
        status: 'unhealthy',
        timestamp: Date.now(),
        instanceId: 'session-manager',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }

      return new Response(JSON.stringify(this.healthCheckData), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  private async handleStatsRequest(): Promise<Response> {
    const stats = {
      activeConnections: this.connections.size,
      totalSessions: this.sessions.size,
      storageKeys: (await this.storage.list()).keys.length,
      uptime: Date.now(), // Would need actual uptime tracking
      healthCheck: this.healthCheckData,
    }

    return new Response(JSON.stringify(stats), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  async alarm(): Promise<void> {
    try {
      // Cleanup expired sessions
      await this.cleanupExpiredSessions()

      // Schedule next alarm
      await this.storage.setAlarm(Date.now() + 300000) // 5 minutes
    } catch (error) {
      console.error('Alarm error:', error)
    }
  }

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
}

// Factory for creating Durable Object instances
export function createSessionManagerDurableObject(
  state: DurableObjectState,
  env: any
): SessionManagerDurableObject {
  return new SessionManagerDurableObject(state, env)
}

// Export for use in worker
export default {
  SessionManagerDurableObject,
}
