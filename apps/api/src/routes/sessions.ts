/**
 * Session Management API Routes
 *
 * Provides HTTP endpoints for session management, WebSocket connections,
 * and real-time collaboration features.
 */

import { type Context, Hono, type Next } from 'hono'
import { z } from 'zod'
import { type AuthContext, authMiddleware } from '../middleware/auth'
import { RateLimitPresets, RateLimitStrategy, rateLimitMiddleware } from '../middleware/rate_limit'
import { type CreateSessionOptions, SessionService } from '../services/session_service'

// Extend Hono context type for session routes
type SessionContext = Context<{
  Bindings: Env
  Variables: {
    sessionService?: SessionService
    auth?: AuthContext
  }
}>

// Request/response schemas
const CreateSessionSchema = z.object({
  ttl: z.number().optional(),
  persistent: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  customLimits: z.record(z.number()).optional(),
  enableCollaboration: z.boolean().optional(),
})

const UpdateSessionSchema = z.object({
  metadata: z.record(z.any()).optional(),
  data: z.record(z.any()).optional(),
  ttl: z.number().optional(),
})

const CreateRoomSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['document', 'chat', 'whiteboard', 'code', 'presentation']),
  settings: z
    .object({
      isPublic: z.boolean().optional(),
      requireApproval: z.boolean().optional(),
      maxParticipants: z.number().min(1).max(100).optional(),
      enableComments: z.boolean().optional(),
      enableVersionHistory: z.boolean().optional(),
      autoSave: z.boolean().optional(),
      autoSaveInterval: z.number().optional(),
      allowAnonymous: z.boolean().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
})

// Initialize session service middleware
const sessionServiceMiddleware = async (c: SessionContext, next: Next) => {
  const sessionService = new SessionService(c.env, {
    enableMetrics: true,
    enableAuditLog: true,
    collaborationEnabled: true,
  })
  c.set('sessionService', sessionService)
  await next()
}

// Create sessions router
const sessionsRouter = new Hono<{ Bindings: Env }>()

// Apply global middleware
sessionsRouter.use('*', sessionServiceMiddleware)
sessionsRouter.use('*', authMiddleware({ required: false }))
sessionsRouter.use(
  '*',
  rateLimitMiddleware({
    ...RateLimitPresets.API_DEFAULT,
    strategy: RateLimitStrategy.SLIDING_WINDOW,
    quotaType: 'session_management',
  })
)

/**
 * GET /sessions
 * List user sessions (authenticated users only)
 */
sessionsRouter.get('/', async (c: SessionContext) => {
  const auth = c.get('auth')
  const sessionService = c.get('sessionService')!

  if (!auth?.isAuthenticated || !auth.user) {
    return c.json({ error: 'Authentication required' }, 401)
  }

  try {
    const { limit, offset, activeOnly } = c.req.query()
    const sessions = await sessionService.getUserSessions(auth.user.id, {
      activeOnly: activeOnly === 'true',
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    })

    return c.json({
      sessions,
      total: sessions.length,
      userId: auth.user.id,
    })
  } catch (error) {
    console.error('Failed to list sessions:', error)
    return c.json({ error: 'Failed to list sessions' }, 500)
  }
})

/**
 * POST /sessions
 * Create a new session
 */
sessionsRouter.post('/', async (c: SessionContext) => {
  const auth = c.get('auth')
  const sessionService = c.get('sessionService')!
  const body = await c.req.json()

  try {
    const validatedData = CreateSessionSchema.parse(body)

    const createOptions: CreateSessionOptions = {
      userId: auth?.user?.id,
      ipAddress: c.req.header('CF-Connecting-IP') || 'unknown',
      userAgent: c.req.header('User-Agent') || 'unknown',
      ...validatedData,
    }

    const session = await sessionService.createSession(createOptions)

    return c.json(
      {
        session,
        websocketUrl: `wss://${c.env.WEBSOCKET_HOST}/session/${session.sessionId}/websocket`,
        message: 'Session created successfully',
      },
      201
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: 'Invalid request data',
          details: error.errors,
        },
        400
      )
    }

    console.error('Failed to create session:', error)
    return c.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create session',
      },
      500
    )
  }
})

/**
 * GET /sessions/:sessionId
 * Get session details
 */
sessionsRouter.get('/:sessionId', async (c: SessionContext) => {
  const auth = c.get('auth')
  const sessionService = c.get('sessionService')!
  const sessionId = c.req.param('sessionId')

  try {
    const session = await sessionService.getSession(sessionId)

    if (!session) {
      return c.json({ error: 'Session not found' }, 404)
    }

    // Check if user has permission to view this session
    if (auth?.user && session.userId !== auth.user.id) {
      // Filter sensitive data for non-owners
      const filteredSession = {
        ...session,
        securityData: undefined,
        rateLimitData: undefined,
      }
      return c.json({ session: filteredSession })
    }

    return c.json({ session })
  } catch (error) {
    console.error('Failed to get session:', error)
    return c.json({ error: 'Failed to get session' }, 500)
  }
})

/**
 * PUT /sessions/:sessionId
 * Update session
 */
sessionsRouter.put('/:sessionId', async (c: SessionContext) => {
  const auth = c.get('auth')
  const sessionService = c.get('sessionService')!
  const sessionId = c.req.param('sessionId')
  const body = await c.req.json()

  try {
    const validatedData = UpdateSessionSchema.parse(body)

    const session = await sessionService.getSession(sessionId)
    if (!session) {
      return c.json({ error: 'Session not found' }, 404)
    }

    // Check if user has permission to update this session
    if (!auth?.user || (session.userId && session.userId !== auth.user.id)) {
      return c.json({ error: 'Insufficient permissions' }, 403)
    }

    const updatedSession = await sessionService.updateSession(
      sessionId,
      validatedData,
      auth.user.id
    )

    if (!updatedSession) {
      return c.json({ error: 'Failed to update session' }, 500)
    }

    return c.json({
      session: updatedSession,
      message: 'Session updated successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: 'Invalid request data',
          details: error.errors,
        },
        400
      )
    }

    console.error('Failed to update session:', error)
    return c.json({ error: 'Failed to update session' }, 500)
  }
})

/**
 * DELETE /sessions/:sessionId
 * Delete session
 */
sessionsRouter.delete('/:sessionId', async (c: SessionContext) => {
  const auth = c.get('auth')
  const sessionService = c.get('sessionService')!
  const sessionId = c.req.param('sessionId')

  try {
    const session = await sessionService.getSession(sessionId)
    if (!session) {
      return c.json({ error: 'Session not found' }, 404)
    }

    // Check if user has permission to delete this session
    if (!auth?.user || (session.userId && session.userId !== auth.user.id)) {
      return c.json({ error: 'Insufficient permissions' }, 403)
    }

    const success = await sessionService.deleteSession(sessionId, auth.user.id)

    if (!success) {
      return c.json({ error: 'Failed to delete session' }, 500)
    }

    return c.json({ message: 'Session deleted successfully' })
  } catch (error) {
    console.error('Failed to delete session:', error)
    return c.json({ error: 'Failed to delete session' }, 500)
  }
})

/**
 * POST /sessions/:sessionId/extend
 * Extend session TTL
 */
sessionsRouter.post('/:sessionId/extend', async (c: SessionContext) => {
  const auth = c.get('auth')
  const sessionService = c.get('sessionService')!
  const sessionId = c.req.param('sessionId')
  const body = await c.req.json()

  try {
    const { additionalTTL } = body
    if (!additionalTTL || typeof additionalTTL !== 'number') {
      return c.json({ error: 'additionalTTL is required and must be a number' }, 400)
    }

    const session = await sessionService.getSession(sessionId)
    if (!session) {
      return c.json({ error: 'Session not found' }, 404)
    }

    // Check if user has permission to extend this session
    if (!auth?.user || (session.userId && session.userId !== auth.user.id)) {
      return c.json({ error: 'Insufficient permissions' }, 403)
    }

    const success = await sessionService.extendSession(sessionId, additionalTTL, auth.user.id)

    if (!success) {
      return c.json({ error: 'Failed to extend session' }, 500)
    }

    return c.json({ message: 'Session extended successfully' })
  } catch (error) {
    console.error('Failed to extend session:', error)
    return c.json({ error: 'Failed to extend session' }, 500)
  }
})

/**
 * GET /sessions/:sessionId/websocket
 * Get WebSocket connection URL for session
 */
sessionsRouter.get('/:sessionId/websocket', async (c: SessionContext) => {
  const auth = c.get('auth')
  const sessionService = c.get('sessionService')!
  const sessionId = c.req.param('sessionId')
  const roomId = c.req.query('roomId')

  try {
    const session = await sessionService.getSession(sessionId)
    if (!session) {
      return c.json({ error: 'Session not found' }, 404)
    }

    // Generate WebSocket URL
    const websocketUrl = await sessionService.createSessionWebSocket(
      sessionId,
      auth?.user?.id,
      c.req.header('Authorization')?.replace('Bearer ', ''),
      roomId
    )

    return c.json({
      websocketUrl,
      sessionId,
      message: 'WebSocket URL generated successfully',
    })
  } catch (error) {
    console.error('Failed to generate WebSocket URL:', error)
    return c.json({ error: 'Failed to generate WebSocket URL' }, 500)
  }
})

/**
 * POST /sessions/:sessionId/rooms
 * Create a collaboration room within the session
 */
sessionsRouter.post('/:sessionId/rooms', async (c: SessionContext) => {
  const auth = c.get('auth')
  const sessionService = c.get('sessionService')!
  const sessionId = c.req.param('sessionId')
  const body = await c.req.json()

  try {
    const validatedData = CreateRoomSchema.parse(body)

    const session = await sessionService.getSession(sessionId)
    if (!session) {
      return c.json({ error: 'Session not found' }, 404)
    }

    // Check if user has permission to create rooms in this session
    if (!auth?.user || (session.userId && session.userId !== auth.user.id)) {
      return c.json({ error: 'Insufficient permissions' }, 403)
    }

    const room = await sessionService.createCollaborationRoom(
      sessionId,
      validatedData,
      auth.user.id
    )

    return c.json(
      {
        room,
        websocketUrl: `wss://${c.env.WEBSOCKET_HOST}/room/${room.roomId}/websocket`,
        message: 'Collaboration room created successfully',
      },
      201
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: 'Invalid request data',
          details: error.errors,
        },
        400
      )
    }

    console.error('Failed to create collaboration room:', error)
    return c.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create collaboration room',
      },
      500
    )
  }
})

/**
 * GET /sessions/:sessionId/rooms
 * List collaboration rooms in the session
 */
sessionsRouter.get('/:sessionId/rooms', async (c: SessionContext) => {
  const auth = c.get('auth')
  const sessionService = c.get('sessionService')!
  const sessionId = c.req.param('sessionId')

  try {
    const session = await sessionService.getSession(sessionId)
    if (!session) {
      return c.json({ error: 'Session not found' }, 404)
    }

    // Check if user has permission to view rooms in this session
    if (!auth?.user || (session.userId && session.userId !== auth.user.id)) {
      return c.json({ error: 'Insufficient permissions' }, 403)
    }

    // Get room details from collaboration room IDs
    const rooms = []
    for (const roomId of session.collaborationData?.roomIds || []) {
      try {
        const collaborationRoom = c.env.COLLABORATION_ROOM as DurableObject
        const response = await collaborationRoom.fetch(
          new Request(`https://dummy-url/room/${roomId}`, { method: 'GET' })
        )

        if (response.ok) {
          const room = await response.json()
          rooms.push(room)
        }
      } catch (error) {
        console.error(`Failed to get room ${roomId}:`, error)
      }
    }

    return c.json({ rooms, sessionId })
  } catch (error) {
    console.error('Failed to list collaboration rooms:', error)
    return c.json({ error: 'Failed to list collaboration rooms' }, 500)
  }
})

/**
 * POST /sessions/:sessionId/rooms/:roomId/join
 * Join a collaboration room
 */
sessionsRouter.post('/:sessionId/rooms/:roomId/join', async (c: SessionContext) => {
  const auth = c.get('auth')
  const sessionService = c.get('sessionService')!
  const sessionId = c.req.param('sessionId')
  const roomId = c.req.param('roomId')

  try {
    const session = await sessionService.getSession(sessionId)
    if (!session) {
      return c.json({ error: 'Session not found' }, 404)
    }

    // Check if user has permission to join rooms in this session
    if (!auth?.user) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    const websocketUrl = await sessionService.joinCollaborationRoom(
      roomId,
      sessionId,
      auth.user.id,
      c.req.header('Authorization')?.replace('Bearer ', '')
    )

    return c.json({
      websocketUrl,
      roomId,
      sessionId,
      message: 'Joined collaboration room successfully',
    })
  } catch (error) {
    console.error('Failed to join collaboration room:', error)
    return c.json(
      {
        error: error instanceof Error ? error.message : 'Failed to join collaboration room',
      },
      500
    )
  }
})

/**
 * GET /sessions/stats
 * Get session statistics (admin only)
 */
sessionsRouter.get('/stats', async (c: SessionContext) => {
  const auth = c.get('auth')
  const sessionService = c.get('sessionService')!

  // Check if user has admin privileges
  if (!auth?.user || auth.user.subscription_tier !== 'enterprise') {
    return c.json({ error: 'Insufficient privileges' }, 403)
  }

  try {
    const stats = await sessionService.getSessionStats()

    return c.json({
      stats,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Failed to get session statistics:', error)
    return c.json({ error: 'Failed to get session statistics' }, 500)
  }
})

/**
 * POST /sessions/cleanup
 * Cleanup expired sessions (admin only)
 */
sessionsRouter.post('/cleanup', async (c: SessionContext) => {
  const auth = c.get('auth')
  const sessionService = c.get('sessionService')!

  // Check if user has admin privileges
  if (!auth?.user || auth.user.subscription_tier !== 'enterprise') {
    return c.json({ error: 'Insufficient privileges' }, 403)
  }

  try {
    const cleanedCount = await sessionService.cleanupExpiredSessions()

    return c.json({
      message: 'Cleanup completed successfully',
      cleanedCount,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Failed to cleanup expired sessions:', error)
    return c.json({ error: 'Failed to cleanup expired sessions' }, 500)
  }
})

/**
 * GET /sessions/health
 * Get session service health status
 */
sessionsRouter.get('/health', async (c: SessionContext) => {
  const sessionService = c.get('sessionService')!

  try {
    const health = await sessionService.getHealthStatus()

    return c.json({
      health,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Failed to get health status:', error)
    return c.json(
      {
        health: {
          status: 'unhealthy',
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        },
        timestamp: Date.now(),
      },
      500
    )
  }
})

/**
 * GET /sessions/:sessionId/export
 * Export session data
 */
sessionsRouter.get('/:sessionId/export', async (c: SessionContext) => {
  const auth = c.get('auth')
  const sessionService = c.get('sessionService')!
  const sessionId = c.req.param('sessionId')
  const format = c.req.query('format') || 'json'

  try {
    const session = await sessionService.getSession(sessionId)
    if (!session) {
      return c.json({ error: 'Session not found' }, 404)
    }

    // Check if user has permission to export this session
    if (!auth?.user || (session.userId && session.userId !== auth.user.id)) {
      return c.json({ error: 'Insufficient permissions' }, 403)
    }

    let exportData: any
    let contentType: string
    let filename: string

    switch (format) {
      case 'json':
        exportData = {
          session: {
            id: session.sessionId,
            userId: session.userId,
            metadata: session.metadata,
            data: session.data,
            createdAt: session.createdAt,
            lastAccessed: session.lastAccessed,
            expiresAt: session.expiresAt,
          },
        }
        contentType = 'application/json'
        filename = `session-${session.sessionId}.json`
        break

      case 'csv':
        // Simple CSV export
        exportData = `Session ID,User ID,Created At,Last Accessed,Expires At\n${session.sessionId},${session.userId || ''},${session.createdAt},${session.lastAccessed},${session.expiresAt}`
        contentType = 'text/csv'
        filename = `session-${session.sessionId}.csv`
        break

      default:
        return c.json({ error: 'Unsupported export format' }, 400)
    }

    return new Response(JSON.stringify(exportData), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Failed to export session:', error)
    return c.json({ error: 'Failed to export session' }, 500)
  }
})

export default sessionsRouter
