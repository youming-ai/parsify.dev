/**
 * WebSocket Message Handlers
 *
 * Provides specialized handlers for different types of WebSocket messages
 * in the session management and collaboration system.
 */

import { EnhancedConnection, EnhancedSessionData } from './session-manager'
import { CollaborationRoom, Participant, Operation } from './collaboration-room'
import { RateLimitService } from '../services/rate_limit_service'

// Base message interface
export interface BaseMessage {
  id: string
  type: string
  timestamp: number
  connectionId: string
  sessionId?: string
  userId?: string
}

// Session management messages
export interface SessionMessage extends BaseMessage {
  type: 'session_create' | 'session_update' | 'session_delete' | 'session_join' | 'session_leave'
  data: {
    sessionId?: string
    userId?: string
    sessionData?: Record<string, any>
    ttl?: number
  }
}

// Real-time collaboration messages
export interface CollaborationMessage extends BaseMessage {
  type: 'operation' | 'cursor' | 'selection' | 'presence' | 'chat' | 'file_share'
  roomId: string
  data: {
    operation?: Operation
    cursor?: { x: number; y: number; selection?: any }
    selection?: any
    presence?: { status: 'active' | 'idle' | 'away'; custom?: any }
    chat?: { message: string; type?: 'text' | 'emoji' | 'system' }
    file?: { id: string; name: string; type: string; size: number }
  }
}

// System messages
export interface SystemMessage extends BaseMessage {
  type: 'heartbeat' | 'ping' | 'pong' | 'error' | 'rate_limit' | 'disconnect'
  data: {
    error?: string
    code?: number
    retryAfter?: number
    reason?: string
  }
}

// Room management messages
export interface RoomMessage extends BaseMessage {
  type: 'room_create' | 'room_join' | 'room_leave' | 'room_update' | 'room_lock' | 'room_unlock'
  data: {
    roomId?: string
    roomName?: string
    roomType?: string
    settings?: Record<string, any>
    participants?: string[]
  }
}

// Union type for all messages
export type WebSocketMessage = SessionMessage | CollaborationMessage | SystemMessage | RoomMessage

// Handler context
export interface HandlerContext {
  connection: EnhancedConnection
  session?: EnhancedSessionData
  room?: CollaborationRoom
  rateLimitService: RateLimitService
  env: Env
  storage: DurableObjectStorage
}

// Handler result
export interface HandlerResult {
  success: boolean
  shouldBroadcast?: boolean
  broadcastMessage?: any
  responseMessage?: any
  error?: string
  statusCode?: number
}

// Message handler interface
export interface MessageHandler {
  canHandle(message: WebSocketMessage): boolean
  handle(message: WebSocketMessage, context: HandlerContext): Promise<HandlerResult>
  validate?(message: WebSocketMessage, context: HandlerContext): Promise<boolean>
  getRateLimitKey?(message: WebSocketMessage, context: HandlerContext): string
}

/**
 * Session Management Handler
 */
export class SessionMessageHandler implements MessageHandler {
  canHandle(message: WebSocketMessage): boolean {
    return message.type.startsWith('session_')
  }

  async validate(message: WebSocketMessage, context: HandlerContext): Promise<boolean> {
    const sessionMsg = message as SessionMessage

    // Validate required fields
    if (!sessionMsg.data.sessionId && sessionMsg.type !== 'session_create') {
      return false
    }

    // Validate user permissions
    if (sessionMsg.type === 'session_delete' || sessionMsg.type === 'session_update') {
      if (!context.session || context.session.userId !== sessionMsg.data.userId) {
        return false
      }
    }

    return true
  }

  getRateLimitKey(message: WebSocketMessage, context: HandlerContext): string {
    const sessionMsg = message as SessionMessage
    return `session:${sessionMsg.data.userId || 'anonymous'}:${message.type}`
  }

  async handle(message: WebSocketMessage, context: HandlerContext): Promise<HandlerResult> {
    const sessionMsg = message as SessionMessage
    const { connection, session, storage } = context

    try {
      switch (sessionMsg.type) {
        case 'session_create':
          return await this.handleSessionCreate(sessionMsg, context)

        case 'session_update':
          return await this.handleSessionUpdate(sessionMsg, context)

        case 'session_delete':
          return await this.handleSessionDelete(sessionMsg, context)

        case 'session_join':
          return await this.handleSessionJoin(sessionMsg, context)

        case 'session_leave':
          return await this.handleSessionLeave(sessionMsg, context)

        default:
          return { success: false, error: 'Unknown session message type' }
      }
    } catch (error) {
      console.error('Session message handler error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500
      }
    }
  }

  private async handleSessionCreate(
    message: SessionMessage,
    context: HandlerContext
  ): Promise<HandlerResult> {
    const { storage } = context
    const { data } = message

    const sessionId = crypto.randomUUID()
    const now = Date.now()

    const newSession: EnhancedSessionData = {
      sessionId,
      userId: data.userId,
      data: data.sessionData || {},
      connections: [{
        connectionId: message.connectionId,
        connectedAt: now,
        lastActivity: now
      }],
      createdAt: now,
      lastAccessed: now,
      expiresAt: now + (data.ttl || 86400000), // 24 hours default
      rateLimitData: {
        apiRequests: 0,
        lastReset: now,
        tier: 'free'
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

    await storage.put(`session:${sessionId}`, newSession)

    return {
      success: true,
      responseMessage: {
        type: 'session_created',
        sessionId,
        timestamp: now
      }
    }
  }

  private async handleSessionUpdate(
    message: SessionMessage,
    context: HandlerContext
  ): Promise<HandlerResult> {
    const { session, storage } = context
    const { data } = message

    if (!session || session.sessionId !== data.sessionId) {
      return { success: false, error: 'Session not found', statusCode: 404 }
    }

    const updatedSession = {
      ...session,
      data: { ...session.data, ...data.sessionData },
      lastAccessed: Date.now()
    }

    await storage.put(`session:${session.sessionId}`, updatedSession)

    return {
      success: true,
      responseMessage: {
        type: 'session_updated',
        sessionId: session.sessionId,
        timestamp: Date.now()
      }
    }
  }

  private async handleSessionDelete(
    message: SessionMessage,
    context: HandlerContext
  ): Promise<HandlerResult> {
    const { session, storage } = context
    const { data } = message

    if (!session || session.sessionId !== data.sessionId) {
      return { success: false, error: 'Session not found', statusCode: 404 }
    }

    await storage.delete(`session:${session.sessionId}`)

    return {
      success: true,
      responseMessage: {
        type: 'session_deleted',
        sessionId: session.sessionId,
        timestamp: Date.now()
      }
    }
  }

  private async handleSessionJoin(
    message: SessionMessage,
    context: HandlerContext
  ): Promise<HandlerResult> {
    const { session, storage, connection } = context
    const { data } = message

    if (!session || session.sessionId !== data.sessionId) {
      return { success: false, error: 'Session not found', statusCode: 404 }
    }

    // Add connection to session
    const connectionData = {
      connectionId: connection.connectionId,
      connectedAt: Date.now(),
      lastActivity: Date.now()
    }

    session.connections.push(connectionData)
    session.lastAccessed = Date.now()

    await storage.put(`session:${session.sessionId}`, session)

    return {
      success: true,
      shouldBroadcast: true,
      broadcastMessage: {
        type: 'user_joined_session',
        sessionId: session.sessionId,
        connectionId: connection.connectionId,
        timestamp: Date.now()
      }
    }
  }

  private async handleSessionLeave(
    message: SessionMessage,
    context: HandlerContext
  ): Promise<HandlerResult> {
    const { session, storage, connection } = context
    const { data } = message

    if (!session || session.sessionId !== data.sessionId) {
      return { success: false, error: 'Session not found', statusCode: 404 }
    }

    // Remove connection from session
    session.connections = session.connections.filter(
      c => c.connectionId !== connection.connectionId
    )
    session.lastAccessed = Date.now()

    await storage.put(`session:${session.sessionId}`, session)

    return {
      success: true,
      shouldBroadcast: true,
      broadcastMessage: {
        type: 'user_left_session',
        sessionId: session.sessionId,
        connectionId: connection.connectionId,
        timestamp: Date.now()
      }
    }
  }
}

/**
 * Collaboration Message Handler
 */
export class CollaborationMessageHandler implements MessageHandler {
  canHandle(message: WebSocketMessage): boolean {
    const collaborationTypes = ['operation', 'cursor', 'selection', 'presence', 'chat', 'file_share']
    return collaborationTypes.includes(message.type)
  }

  async validate(message: WebSocketMessage, context: HandlerContext): Promise<boolean> {
    const collabMsg = message as CollaborationMessage

    // Validate room membership
    if (!context.room || !context.room.participants.some(p => p.connectionId === message.connectionId)) {
      return false
    }

    // Validate permissions based on message type
    const participant = context.room.participants.find(p => p.connectionId === message.connectionId)
    if (!participant) return false

    switch (collabMsg.type) {
      case 'operation':
        return participant.permissions.includes('write')
      case 'chat':
        return participant.permissions.includes('chat')
      case 'file_share':
        return participant.permissions.includes('upload')
      default:
        return true
    }
  }

  getRateLimitKey(message: WebSocketMessage, context: HandlerContext): string {
    const collabMsg = message as CollaborationMessage
    const participant = context.room?.participants.find(p => p.connectionId === message.connectionId)
    const tier = participant?.role || 'viewer'
    return `collab:${collabMsg.roomId}:${tier}:${message.type}`
  }

  async handle(message: WebSocketMessage, context: HandlerContext): Promise<HandlerResult> {
    const collabMsg = message as CollaborationMessage
    const { connection, room } = context

    try {
      switch (collabMsg.type) {
        case 'operation':
          return await this.handleOperation(collabMsg, context)

        case 'cursor':
          return await this.handleCursor(collabMsg, context)

        case 'selection':
          return await this.handleSelection(collabMsg, context)

        case 'presence':
          return await this.handlePresence(collabMsg, context)

        case 'chat':
          return await this.handleChat(collabMsg, context)

        case 'file_share':
          return await this.handleFileShare(collabMsg, context)

        default:
          return { success: false, error: 'Unknown collaboration message type' }
      }
    } catch (error) {
      console.error('Collaboration message handler error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500
      }
    }
  }

  private async handleOperation(
    message: CollaborationMessage,
    context: HandlerContext
  ): Promise<HandlerResult> {
    const { room } = context
    const { data } = message

    if (!data.operation) {
      return { success: false, error: 'Operation data required' }
    }

    // Apply operation to room document
    // This would integrate with the operational transformation logic
    // For now, we'll just broadcast it

    return {
      success: true,
      shouldBroadcast: true,
      broadcastMessage: {
        type: 'operation_applied',
        roomId: message.roomId,
        operation: data.operation,
        authorId: message.userId,
        connectionId: message.connectionId,
        timestamp: Date.now()
      }
    }
  }

  private async handleCursor(
    message: CollaborationMessage,
    context: HandlerContext
  ): Promise<HandlerResult> {
    const { room } = context
    const { data } = message

    if (!data.cursor) {
      return { success: false, error: 'Cursor data required' }
    }

    // Update participant cursor in room
    const participant = room.participants.find(p => p.connectionId === message.connectionId)
    if (participant) {
      participant.cursor = data.cursor
      participant.lastActivity = Date.now()
    }

    return {
      success: true,
      shouldBroadcast: true,
      broadcastMessage: {
        type: 'cursor_updated',
        roomId: message.roomId,
        connectionId: message.connectionId,
        cursor: data.cursor,
        timestamp: Date.now()
      }
    }
  }

  private async handleSelection(
    message: CollaborationMessage,
    context: HandlerContext
  ): Promise<HandlerResult> {
    const { data } = message

    if (!data.selection) {
      return { success: false, error: 'Selection data required' }
    }

    return {
      success: true,
      shouldBroadcast: true,
      broadcastMessage: {
        type: 'selection_updated',
        roomId: message.roomId,
        connectionId: message.connectionId,
        selection: data.selection,
        timestamp: Date.now()
      }
    }
  }

  private async handlePresence(
    message: CollaborationMessage,
    context: HandlerContext
  ): Promise<HandlerResult> {
    const { room } = context
    const { data } = message

    if (!data.presence) {
      return { success: false, error: 'Presence data required' }
    }

    // Update participant presence
    const participant = room.participants.find(p => p.connectionId === message.connectionId)
    if (participant) {
      participant.status = data.presence.status
      participant.lastActivity = Date.now()
    }

    return {
      success: true,
      shouldBroadcast: true,
      broadcastMessage: {
        type: 'presence_updated',
        roomId: message.roomId,
        connectionId: message.connectionId,
        presence: data.presence,
        timestamp: Date.now()
      }
    }
  }

  private async handleChat(
    message: CollaborationMessage,
    context: HandlerContext
  ): Promise<HandlerResult> {
    const { room } = context
    const { data } = message

    if (!data.chat) {
      return { success: false, error: 'Chat data required' }
    }

    const participant = room.participants.find(p => p.connectionId === message.connectionId)
    const chatMessage = {
      id: crypto.randomUUID(),
      connectionId: message.connectionId,
      username: participant?.username || 'Anonymous',
      message: data.chat.message,
      type: data.chat.type || 'text',
      timestamp: Date.now()
    }

    return {
      success: true,
      shouldBroadcast: true,
      broadcastMessage: {
        type: 'chat_message',
        roomId: message.roomId,
        chatMessage,
        timestamp: Date.now()
      }
    }
  }

  private async handleFileShare(
    message: CollaborationMessage,
    context: HandlerContext
  ): Promise<HandlerResult> {
    const { data } = message

    if (!data.file) {
      return { success: false, error: 'File data required' }
    }

    // In a real implementation, this would handle file uploads
    // For now, just broadcast the file share notification

    return {
      success: true,
      shouldBroadcast: true,
      broadcastMessage: {
        type: 'file_shared',
        roomId: message.roomId,
        connectionId: message.connectionId,
        file: data.file,
        timestamp: Date.now()
      }
    }
  }
}

/**
 * System Message Handler
 */
export class SystemMessageHandler implements MessageHandler {
  canHandle(message: WebSocketMessage): boolean {
    const systemTypes = ['heartbeat', 'ping', 'pong', 'error', 'rate_limit', 'disconnect']
    return systemTypes.includes(message.type)
  }

  async handle(message: WebSocketMessage, context: HandlerContext): Promise<HandlerResult> {
    const systemMsg = message as SystemMessage
    const { connection } = context

    try {
      switch (systemMsg.type) {
        case 'ping':
          return {
            success: true,
            responseMessage: {
              type: 'pong',
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              connectionId: connection.connectionId
            }
          }

        case 'pong':
          // Update connection activity
          connection.lastPong = Date.now()
          return { success: true }

        case 'heartbeat':
          connection.lastActivity = Date.now()
          return {
            success: true,
            responseMessage: {
              type: 'heartbeat_ack',
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              connectionId: connection.connectionId
            }
          }

        case 'disconnect':
          return {
            success: true,
            responseMessage: {
              type: 'disconnect_ack',
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              connectionId: connection.connectionId,
              reason: systemMsg.data.reason || 'User requested disconnect'
            }
          }

        default:
          return { success: false, error: 'Unknown system message type' }
      }
    } catch (error) {
      console.error('System message handler error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

/**
 * Room Management Handler
 */
export class RoomMessageHandler implements MessageHandler {
  canHandle(message: WebSocketMessage): boolean {
    return message.type.startsWith('room_')
  }

  async validate(message: WebSocketMessage, context: HandlerContext): Promise<boolean> {
    const roomMsg = message as RoomMessage

    // Validate room creation permissions
    if (roomMsg.type === 'room_create') {
      return !!message.userId // Only authenticated users can create rooms
    }

    // Validate room membership for other operations
    if (context.room && !context.room.participants.some(p => p.connectionId === message.connectionId)) {
      return false
    }

    return true
  }

  async handle(message: WebSocketMessage, context: HandlerContext): Promise<HandlerResult> {
    const roomMsg = message as RoomMessage

    try {
      switch (roomMsg.type) {
        case 'room_create':
          return await this.handleRoomCreate(roomMsg, context)

        case 'room_join':
          return await this.handleRoomJoin(roomMsg, context)

        case 'room_leave':
          return await this.handleRoomLeave(roomMsg, context)

        case 'room_update':
          return await this.handleRoomUpdate(roomMsg, context)

        default:
          return { success: false, error: 'Unknown room message type' }
      }
    } catch (error) {
      console.error('Room message handler error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async handleRoomCreate(
    message: RoomMessage,
    context: HandlerContext
  ): Promise<HandlerResult> {
    const { storage } = context
    const { data } = message

    if (!data.roomName || !data.roomType) {
      return { success: false, error: 'Room name and type required' }
    }

    const roomId = crypto.randomUUID()
    const now = Date.now()

    const newRoom: CollaborationRoom = {
      roomId,
      name: data.roomName,
      type: data.roomType as any,
      ownerId: message.userId!,
      participants: [{
        userId: message.userId,
        connectionId: message.connectionId,
        username: data.roomName, // Temporary, would get from user service
        role: 'owner',
        permissions: ['read', 'write', 'delete', 'admin', 'share'],
        joinedAt: now,
        lastActivity: now,
        status: 'active',
        color: this.generateUserColor()
      }],
      document: {
        content: '',
        version: 0,
        lastModified: now,
        lastModifiedBy: message.userId,
        operations: [],
        checkpoints: []
      },
      settings: {
        isPublic: data.settings?.isPublic || false,
        requireApproval: data.settings?.requireApproval || false,
        maxParticipants: data.settings?.maxParticipants || 10,
        enableComments: data.settings?.enableComments !== false,
        enableVersionHistory: data.settings?.enableVersionHistory !== false,
        autoSave: data.settings?.autoSave !== false,
        autoSaveInterval: data.settings?.autoSaveInterval || 30,
        lockAfterInactivity: data.settings?.lockAfterInactivity || false,
        inactivityTimeout: data.settings?.inactivityTimeout || 1800,
        allowAnonymous: data.settings?.allowAnonymous || false
      },
      metadata: {
        description: data.settings?.description,
        tags: data.settings?.tags || [],
        createdAt: now,
        updatedAt: now
      },
      status: 'active'
    }

    await storage.put(`room:${roomId}`, newRoom)

    return {
      success: true,
      responseMessage: {
        type: 'room_created',
        roomId,
        room: newRoom,
        timestamp: now
      }
    }
  }

  private async handleRoomJoin(
    message: RoomMessage,
    context: HandlerContext
  ): Promise<HandlerResult> {
    const { room, storage } = context
    const { data } = message

    if (!room || room.roomId !== data.roomId) {
      return { success: false, error: 'Room not found', statusCode: 404 }
    }

    // Check if room is full
    if (room.participants.length >= room.settings.maxParticipants) {
      return { success: false, error: 'Room is full', statusCode: 407 }
    }

    // Check if user is already in room
    if (room.participants.some(p => p.connectionId === message.connectionId)) {
      return { success: true }
    }

    // Add participant
    const participant: Participant = {
      userId: message.userId,
      connectionId: message.connectionId,
      username: 'User', // Would get from user service
      role: 'viewer',
      permissions: ['read'],
      joinedAt: Date.now(),
      lastActivity: Date.now(),
      status: 'active',
      color: this.generateUserColor()
    }

    room.participants.push(participant)
    room.metadata.updatedAt = Date.now()

    await storage.put(`room:${room.roomId}`, room)

    return {
      success: true,
      shouldBroadcast: true,
      broadcastMessage: {
        type: 'user_joined_room',
        roomId: room.roomId,
        participant: this.sanitizeParticipant(participant),
        timestamp: Date.now()
      }
    }
  }

  private async handleRoomLeave(
    message: RoomMessage,
    context: HandlerContext
  ): Promise<HandlerResult> {
    const { room, storage } = context
    const { data } = message

    if (!room || room.roomId !== data.roomId) {
      return { success: false, error: 'Room not found', statusCode: 404 }
    }

    // Remove participant
    room.participants = room.participants.filter(p => p.connectionId !== message.connectionId)
    room.metadata.updatedAt = Date.now()

    await storage.put(`room:${room.roomId}`, room)

    return {
      success: true,
      shouldBroadcast: true,
      broadcastMessage: {
        type: 'user_left_room',
        roomId: room.roomId,
        connectionId: message.connectionId,
        timestamp: Date.now()
      }
    }
  }

  private async handleRoomUpdate(
    message: RoomMessage,
    context: HandlerContext
  ): Promise<HandlerResult> {
    const { room, storage } = context
    const { data } = message

    if (!room || room.roomId !== data.roomId) {
      return { success: false, error: 'Room not found', statusCode: 404 }
    }

    // Check if user has permission to update room
    const participant = room.participants.find(p => p.connectionId === message.connectionId)
    if (!participant || !participant.permissions.includes('admin')) {
      return { success: false, error: 'Insufficient permissions', statusCode: 403 }
    }

    // Update room settings
    if (data.settings) {
      room.settings = { ...room.settings, ...data.settings }
    }
    if (data.roomName) {
      room.name = data.roomName
    }

    room.metadata.updatedAt = Date.now()

    await storage.put(`room:${room.roomId}`, room)

    return {
      success: true,
      shouldBroadcast: true,
      broadcastMessage: {
        type: 'room_updated',
        roomId: room.roomId,
        settings: room.settings,
        name: room.name,
        timestamp: Date.now()
      }
    }
  }

  private generateUserColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  private sanitizeParticipant(participant: Participant): Participant {
    return {
      ...participant,
      userId: participant.userId ? participant.userId.substring(0, 8) + '...' : undefined
    }
  }
}

/**
 * Message Handler Manager
 */
export class MessageHandlerManager {
  private handlers: MessageHandler[]

  constructor() {
    this.handlers = [
      new SessionMessageHandler(),
      new CollaborationMessageHandler(),
      new SystemMessageHandler(),
      new RoomMessageHandler()
    ]
  }

  async handleMessage(
    message: WebSocketMessage,
    context: HandlerContext
  ): Promise<HandlerResult> {
    // Find appropriate handler
    const handler = this.handlers.find(h => h.canHandle(message))
    if (!handler) {
      return {
        success: false,
        error: `No handler found for message type: ${message.type}`,
        statusCode: 400
      }
    }

    // Check rate limits
    if (handler.getRateLimitKey) {
      const rateLimitKey = handler.getRateLimitKey(message, context)
      const isAllowed = await this.checkRateLimit(rateLimitKey, context)

      if (!isAllowed) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          statusCode: 429
        }
      }
    }

    // Validate message
    if (handler.validate) {
      const isValid = await handler.validate(message, context)
      if (!isValid) {
        return {
          success: false,
          error: 'Message validation failed',
          statusCode: 400
        }
      }
    }

    // Handle message
    return await handler.handle(message, context)
  }

  private async checkRateLimit(
    key: string,
    context: HandlerContext
  ): Promise<boolean> {
    try {
      const check = await context.rateLimitService.checkRateLimit({
        identifier: key,
        quotaType: 'websocket_messages',
        amount: 1
      })
      return check.allowed
    } catch (error) {
      console.error('Rate limit check failed:', error)
      return true // Fail open
    }
  }

  addHandler(handler: MessageHandler): void {
    this.handlers.push(handler)
  }

  removeHandler(handler: MessageHandler): void {
    const index = this.handlers.indexOf(handler)
    if (index > -1) {
      this.handlers.splice(index, 1)
    }
  }
}

export default MessageHandlerManager
