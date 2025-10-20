/**
 * Collaboration Room Durable Object
 *
 * Manages real-time collaboration rooms for documents, chat, whiteboards,
 * and code editing with conflict resolution and version control.
 */

import { DurableObjectState, DurableObjectStorage } from '@cloudflare/workers-types'
import { User } from '../models/user'

// Room types and configurations
export type RoomType = 'document' | 'chat' | 'whiteboard' | 'code' | 'presentation'

// Participant roles and permissions
export type ParticipantRole = 'owner' | 'editor' | 'commenter' | 'viewer'

export interface Participant {
  userId?: string
  connectionId: string
  username: string
  role: ParticipantRole
  permissions: string[]
  joinedAt: number
  lastActivity: number
  cursor?: {
    x: number
    y: number
    selection?: any
  }
  status: 'active' | 'idle' | 'away'
  color?: string // User's color in the room
}

// Operation types for collaborative editing
export interface Operation {
  id: string
  type: 'insert' | 'delete' | 'retain' | 'format' | 'cursor' | 'selection'
  position: number
  content?: any
  length?: number
  attributes?: Record<string, any>
  authorId?: string
  timestamp: number
  revision: number
}

// Document state with version history
export interface DocumentState {
  content: any
  version: number
  lastModified: number
  lastModifiedBy?: string
  operations: Operation[]
  checkpoints: Array<{
    version: number
    content: any
    timestamp: number
    authorId?: string
  }>
}

// Room configuration
export interface RoomConfig {
  roomId: string
  name: string
  type: RoomType
  ownerId: string
  participants: Participant[]
  document: DocumentState
  settings: {
    isPublic: boolean
    requireApproval: boolean
    maxParticipants: number
    enableComments: boolean
    enableVersionHistory: boolean
    autoSave: boolean
    autoSaveInterval: number
    lockAfterInactivity: boolean
    inactivityTimeout: number
    allowAnonymous: boolean
    password?: string
  }
  metadata: {
    description?: string
    tags?: string[]
    thumbnail?: string
    createdAt: number
    updatedAt: number
  }
  status: 'active' | 'locked' | 'archived'
}

// Real-time events
export interface RoomEvent {
  type: 'user_joined' | 'user_left' | 'operation_applied' |
        'cursor_moved' | 'selection_changed' | 'room_locked' |
        'room_unlocked' | 'document_saved' | 'conflict_resolved'
  roomId: string
  userId?: string
  connectionId: string
  timestamp: number
  data?: any
}

// WebSocket message types
export interface RoomMessage {
  type: 'operation' | 'cursor' | 'selection' | 'chat' | 'presence' | 'heartbeat'
  userId?: string
  connectionId: string
  data: any
  timestamp: number
}

export class CollaborationRoomDurableObject {
  private storage: DurableObjectStorage
  private env: Env
  private roomId: string

  // Room state
  private room: RoomConfig | null = null

  // Active connections
  private connections: Map<string, WebSocket>
  private participants: Map<string, Participant>

  // Operational transformation
  private operationQueue: Operation[]
  private currentRevision: number
  private isProcessing: boolean

  // Auto-save timer
  private autoSaveTimer: number | null = null

  // Metrics
  private metrics: {
    totalOperations: number
    totalMessages: number
    conflictsResolved: number
    autoSaves: number
    peakParticipants: number
  }

  constructor(state: DurableObjectState, env: Env) {
    this.storage = state.storage
    this.env = env
    this.roomId = state.id as string

    // Initialize state
    this.connections = new Map()
    this.participants = new Map()
    this.operationQueue = []
    this.currentRevision = 0
    this.isProcessing = false

    // Initialize metrics
    this.metrics = {
      totalOperations: 0,
      totalMessages: 0,
      conflictsResolved: 0,
      autoSaves: 0,
      peakParticipants: 0
    }

    // Load room data from storage
    this.loadRoomFromStorage()

    // Set up alarm for maintenance
    this.initializeAlarm()
  }

  /**
   * Main fetch handler
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname.split('/').filter(Boolean)

    try {
      switch (path[0]) {
        case 'websocket':
          return this.handleWebSocketConnection(request)

        case 'join':
          return this.handleJoinRequest(request)

        case 'leave':
          return this.handleLeaveRequest(request)

        case 'document':
          return this.handleDocumentRequest(request, path[1])

        case 'operations':
          return this.handleOperationsRequest(request)

        case 'history':
          return this.handleHistoryRequest(request)

        case 'export':
          return this.handleExportRequest(request)

        case 'admin':
          return this.handleAdminRequest(request, path[1])

        default:
          return new Response('Not Found', { status: 404 })
      }
    } catch (error) {
      console.error('Collaboration Room error:', error)
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
   * Handle WebSocket connection upgrades
   */
  private async handleWebSocketConnection(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade')
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected websocket', { status: 426 })
    }

    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const username = url.searchParams.get('username') || 'Anonymous'
    const token = url.searchParams.get('token')
    const connectionId = crypto.randomUUID()

    // Validate room exists
    if (!this.room) {
      return new Response('Room not found', { status: 404 })
    }

    // Check if room is locked
    if (this.room.status === 'locked') {
      return new Response('Room is locked', { status: 403 })
    }

    // Check if room is full
    if (this.participants.size >= this.room.settings.maxParticipants) {
      return new Response('Room is full', { status: 407 })
    }

    // Validate token if provided
    if (token && userId) {
      try {
        // Verify JWT token
        const authService = new (await import('../services/auth_service')).AuthService({
          db: this.env.DB,
          kv: this.env.SESSIONS,
          jwtSecret: this.env.JWT_SECRET || 'default-secret',
          sessionTimeoutMinutes: 30,
        })

        const payload = await authService.verifyToken(token, request.headers.get('CF-Connecting-IP') || 'unknown')
        if (!payload) {
          return new Response('Invalid token', { status: 401 })
        }
      } catch (error) {
        return new Response('Token validation failed', { status: 401 })
      }
    }

    // Check if user has permission to join
    if (!this.canUserJoin(userId, username)) {
      return new Response('Permission denied', { status: 403 })
    }

    // Create WebSocket pair
    const [client, server] = Object.values(new WebSocketPair())
    server.accept()

    // Create participant
    const participant: Participant = {
      userId,
      connectionId,
      username,
      role: this.determineUserRole(userId),
      permissions: this.getPermissionsForRole(this.determineUserRole(userId)),
      joinedAt: Date.now(),
      lastActivity: Date.now(),
      status: 'active',
      color: this.generateUserColor()
    }

    // Add participant and connection
    this.participants.set(connectionId, participant)
    this.connections.set(connectionId, server)

    // Update room participants
    if (this.room) {
      this.room.participants.push(participant)
      this.room.metadata.updatedAt = Date.now()
      await this.saveRoomToStorage()
    }

    // Update metrics
    this.metrics.peakParticipants = Math.max(this.metrics.peakParticipants, this.participants.size)

    // Set up WebSocket handlers
    this.setupWebSocketHandlers(server, connectionId, userId)

    // Send welcome message with current room state
    server.send(JSON.stringify({
      type: 'room_joined',
      connectionId,
      room: {
        id: this.roomId,
        name: this.room?.name,
        type: this.room?.type,
        document: this.room?.document,
        participants: Array.from(this.participants.values()),
        settings: this.room?.settings
      },
      timestamp: Date.now()
    }))

    // Notify other participants
    this.broadcastToOthers(connectionId, {
      type: 'user_joined',
      participant: this.sanitizeParticipant(participant),
      timestamp: Date.now()
    })

    // Start auto-save if enabled
    this.startAutoSave()

    return new Response(null, { status: 101, webSocket: client })
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupWebSocketHandlers(
    websocket: WebSocket,
    connectionId: string,
    userId?: string
  ): void {
    websocket.addEventListener('message', async (event) => {
      try {
        await this.handleWebSocketMessage(connectionId, event.data, userId)
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
      await this.handleWebSocketClose(connectionId, userId, event)
    })

    websocket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error)
    })
  }

  /**
   * Handle incoming WebSocket messages
   */
  private async handleWebSocketMessage(
    connectionId: string,
    data: string,
    userId?: string
  ): Promise<void> {
    const message: RoomMessage = JSON.parse(data)
    const participant = this.participants.get(connectionId)

    if (!participant) {
      return
    }

    // Update participant activity
    participant.lastActivity = Date.now()
    participant.status = 'active'

    this.metrics.totalMessages++

    switch (message.type) {
      case 'operation':
        await this.handleOperationMessage(connectionId, message, userId)
        break

      case 'cursor':
        await this.handleCursorMessage(connectionId, message)
        break

      case 'selection':
        await this.handleSelectionMessage(connectionId, message)
        break

      case 'chat':
        await this.handleChatMessage(connectionId, message)
        break

      case 'presence':
        await this.handlePresenceMessage(connectionId, message)
        break

      case 'heartbeat':
        // Just update activity
        break

      default:
        console.warn('Unknown message type:', message.type)
    }
  }

  /**
   * Handle operation messages (collaborative editing)
   */
  private async handleOperationMessage(
    connectionId: string,
    message: RoomMessage,
    userId?: string
  ): Promise<void> {
    const participant = this.participants.get(connectionId)
    if (!participant || !this.hasPermission(participant, 'edit')) {
      return
    }

    const operation: Operation = {
      ...message.data,
      id: crypto.randomUUID(),
      authorId: userId,
      timestamp: Date.now(),
      revision: this.currentRevision + 1
    }

    // Add to operation queue
    this.operationQueue.push(operation)

    // Process operations if not already processing
    if (!this.isProcessing) {
      await this.processOperationQueue()
    }

    // Broadcast operation to other participants
    this.broadcastToOthers(connectionId, {
      type: 'operation_applied',
      operation,
      timestamp: Date.now()
    })

    this.metrics.totalOperations++
  }

  /**
   * Handle cursor position updates
   */
  private async handleCursorMessage(
    connectionId: string,
    message: RoomMessage
  ): Promise<void> {
    const participant = this.participants.get(connectionId)
    if (!participant) return

    participant.cursor = message.data

    // Broadcast cursor position to others
    this.broadcastToOthers(connectionId, {
      type: 'cursor_moved',
      connectionId,
      username: participant.username,
      color: participant.color,
      cursor: message.data,
      timestamp: Date.now()
    })
  }

  /**
   * Handle selection changes
   */
  private async handleSelectionMessage(
    connectionId: string,
    message: RoomMessage
  ): Promise<void> {
    const participant = this.participants.get(connectionId)
    if (!participant) return

    // Broadcast selection to others
    this.broadcastToOthers(connectionId, {
      type: 'selection_changed',
      connectionId,
      username: participant.username,
      color: participant.color,
      selection: message.data,
      timestamp: Date.now()
    })
  }

  /**
   * Handle chat messages
   */
  private async handleChatMessage(
    connectionId: string,
    message: RoomMessage
  ): Promise<void> {
    const participant = this.participants.get(connectionId)
    if (!participant || !this.hasPermission(participant, 'chat')) {
      return
    }

    const chatMessage = {
      id: crypto.randomUUID(),
      connectionId,
      username: participant.username,
      color: participant.color,
      message: message.data.message,
      timestamp: Date.now()
    }

    // Broadcast chat message to all participants
    this.broadcastToAll({
      type: 'chat_message',
      chatMessage,
      timestamp: Date.now()
    })
  }

  /**
   * Handle presence updates
   */
  private async handlePresenceMessage(
    connectionId: string,
    message: RoomMessage
  ): Promise<void> {
    const participant = this.participants.get(connectionId)
    if (!participant) return

    participant.status = message.data.status || 'active'

    // Broadcast presence update to others
    this.broadcastToOthers(connectionId, {
      type: 'presence_updated',
      connectionId,
      username: participant.username,
      status: participant.status,
      timestamp: Date.now()
    })
  }

  /**
   * Handle WebSocket close events
   */
  private async handleWebSocketClose(
    connectionId: string,
    userId?: string,
    event?: CloseEvent
  ): Promise<void> {
    const participant = this.participants.get(connectionId)
    if (!participant) return

    // Remove participant and connection
    this.participants.delete(connectionId)
    this.connections.delete(connectionId)

    // Update room participants
    if (this.room) {
      this.room.participants = this.room.participants.filter(p => p.connectionId !== connectionId)
      this.room.metadata.updatedAt = Date.now()
      await this.saveRoomToStorage()
    }

    // Notify other participants
    this.broadcastToAll({
      type: 'user_left',
      connectionId,
      username: participant.username,
      timestamp: Date.now()
    })

    // Stop auto-save if no participants left
    if (this.participants.size === 0) {
      this.stopAutoSave()
      await this.finalSave()
    }
  }

  /**
   * Process operation queue with operational transformation
   */
  private async processOperationQueue(): Promise<void> {
    if (this.isProcessing || this.operationQueue.length === 0) {
      return
    }

    this.isProcessing = true

    try {
      while (this.operationQueue.length > 0) {
        const operation = this.operationQueue.shift()!

        // Apply operational transformation
        const transformedOp = this.transformOperation(operation)

        // Apply operation to document
        this.applyOperationToDocument(transformedOp)

        // Update revision
        this.currentRevision = transformedOp.revision
      }

      // Save document state periodically
      if (this.currentRevision % 10 === 0) {
        await this.saveRoomToStorage()
      }
    } catch (error) {
      console.error('Error processing operation queue:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Transform operation based on current document state
   */
  private transformOperation(operation: Operation): Operation {
    // Simplified operational transformation
    // In production, this would be more sophisticated

    // Check for conflicts with existing operations
    const conflicts = this.findConflicts(operation)

    if (conflicts.length > 0) {
      // Resolve conflicts
      return this.resolveConflicts(operation, conflicts)
    }

    return operation
  }

  /**
   * Find conflicting operations
   */
  private findConflicts(operation: Operation): Operation[] {
    const conflicts: Operation[] = []

    for (const existingOp of this.room?.document.operations || []) {
      if (this.operationsConflict(operation, existingOp)) {
        conflicts.push(existingOp)
      }
    }

    return conflicts
  }

  /**
   * Check if two operations conflict
   */
  private operationsConflict(op1: Operation, op2: Operation): boolean {
    // Simple conflict detection based on position overlap
    const op1End = op1.position + (op1.length || 0)
    const op2End = op2.position + (op2.length || 0)

    return (op1.position <= op2End && op2.position <= op1End) &&
           (op1.type === 'insert' || op1.type === 'delete') &&
           (op2.type === 'insert' || op2.type === 'delete')
  }

  /**
   * Resolve conflicts between operations
   */
  private resolveConflicts(operation: Operation, conflicts: Operation[]): Operation {
    this.metrics.conflictsResolved++

    // Simple conflict resolution - adjust position
    let adjustedOp = { ...operation }

    for (const conflict of conflicts) {
      if (conflict.type === 'insert' && conflict.position <= adjustedOp.position) {
        adjustedOp.position += conflict.content?.length || 0
      } else if (conflict.type === 'delete' && conflict.position < adjustedOp.position) {
        adjustedOp.position -= conflict.length || 0
      }
    }

    return adjustedOp
  }

  /**
   * Apply operation to document
   */
  private applyOperationToDocument(operation: Operation): void {
    if (!this.room) return

    const { document } = this.room

    // Apply operation based on type
    switch (operation.type) {
      case 'insert':
        this.applyInsertOperation(document, operation)
        break
      case 'delete':
        this.applyDeleteOperation(document, operation)
        break
      case 'format':
        this.applyFormatOperation(document, operation)
        break
      case 'retain':
        // No change needed for retain operations
        break
    }

    // Add operation to history
    document.operations.push(operation)
    document.version = operation.revision
    document.lastModified = operation.timestamp
    document.lastModifiedBy = operation.authorId

    // Create checkpoint periodically
    if (operation.revision % 50 === 0) {
      this.createCheckpoint()
    }
  }

  /**
   * Apply insert operation
   */
  private applyInsertOperation(document: DocumentState, operation: Operation): void {
    // Simplified insert operation
    if (typeof document.content === 'string') {
      document.content =
        document.content.slice(0, operation.position) +
        (operation.content || '') +
        document.content.slice(operation.position)
    }
  }

  /**
   * Apply delete operation
   */
  private applyDeleteOperation(document: DocumentState, operation: Operation): void {
    if (typeof document.content === 'string' && operation.length) {
      document.content =
        document.content.slice(0, operation.position) +
        document.content.slice(operation.position + operation.length)
    }
  }

  /**
   * Apply format operation
   */
  private applyFormatOperation(document: DocumentState, operation: Operation): void {
    // Simplified format operation - would be more complex in production
    if (document.content && typeof document.content === 'object') {
      // Apply formatting attributes
      Object.assign(document.content, operation.attributes || {})
    }
  }

  /**
   * Create document checkpoint
   */
  private createCheckpoint(): void {
    if (!this.room) return

    const checkpoint = {
      version: this.currentRevision,
      content: this.room.document.content,
      timestamp: Date.now(),
      authorId: this.room.document.lastModifiedBy
    }

    this.room.document.checkpoints.push(checkpoint)

    // Limit checkpoint history
    if (this.room.document.checkpoints.length > 20) {
      this.room.document.checkpoints = this.room.document.checkpoints.slice(-20)
    }
  }

  /**
   * Broadcasting methods
   */
  private broadcastToAll(message: any): void {
    const messageStr = JSON.stringify(message)

    for (const [connectionId, websocket] of this.connections) {
      if (websocket.readyState === WebSocket.OPEN) {
        try {
          websocket.send(messageStr)
        } catch (error) {
          console.error('Failed to send message to connection:', error)
        }
      }
    }
  }

  private broadcastToOthers(excludeConnectionId: string, message: any): void {
    const messageStr = JSON.stringify(message)

    for (const [connectionId, websocket] of this.connections) {
      if (connectionId !== excludeConnectionId && websocket.readyState === WebSocket.OPEN) {
        try {
          websocket.send(messageStr)
        } catch (error) {
          console.error('Failed to send message to connection:', error)
        }
      }
    }
  }

  /**
   * Auto-save functionality
   */
  private startAutoSave(): void {
    if (!this.room?.settings.autoSave || this.autoSaveTimer) {
      return
    }

    this.autoSaveTimer = setInterval(async () => {
      await this.saveRoomToStorage()
      this.metrics.autoSaves++

      // Notify participants of save
      this.broadcastToAll({
        type: 'document_saved',
        timestamp: Date.now()
      })
    }, this.room.settings.autoSaveInterval * 1000)
  }

  private stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = null
    }
  }

  private async finalSave(): Promise<void> {
    await this.saveRoomToStorage()
    this.createCheckpoint()
  }

  /**
   * Storage methods
   */
  private async loadRoomFromStorage(): Promise<void> {
    try {
      this.room = await this.storage.get('room')
      if (this.room) {
        this.currentRevision = this.room.document.version
      }
    } catch (error) {
      console.error('Failed to load room from storage:', error)
    }
  }

  private async saveRoomToStorage(): Promise<void> {
    if (!this.room) return

    try {
      await this.storage.put('room', this.room)
      await this.storage.put('metrics', this.metrics)
    } catch (error) {
      console.error('Failed to save room to storage:', error)
    }
  }

  /**
   * Permission and access control methods
   */
  private canUserJoin(userId?: string, username?: string): boolean {
    if (!this.room) return false

    // Check if room is public or user is owner
    if (this.room.settings.isPublic || this.room.ownerId === userId) {
      return true
    }

    // Check if anonymous access is allowed
    if (!userId && !this.room.settings.allowAnonymous) {
      return false
    }

    // Check if room requires approval
    if (this.room.settings.requireApproval && this.room.ownerId !== userId) {
      return false
    }

    return true
  }

  private determineUserRole(userId?: string): ParticipantRole {
    if (!this.room || !userId) return 'viewer'

    if (this.room.ownerId === userId) return 'owner'

    // Check if user was previously invited with specific role
    const existingParticipant = this.room.participants.find(p => p.userId === userId)
    return existingParticipant?.role || 'viewer'
  }

  private getPermissionsForRole(role: ParticipantRole): string[] {
    const permissions: Record<ParticipantRole, string[]> = {
      owner: ['read', 'write', 'delete', 'admin', 'share', 'chat'],
      editor: ['read', 'write', 'chat'],
      commenter: ['read', 'comment', 'chat'],
      viewer: ['read']
    }

    return permissions[role] || ['read']
  }

  private hasPermission(participant: Participant, permission: string): boolean {
    return participant.permissions.includes(permission)
  }

  private generateUserColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ]

    return colors[Math.floor(Math.random() * colors.length)]
  }

  private sanitizeParticipant(participant: Participant): Participant {
    // Remove sensitive information
    return {
      ...participant,
      connectionId: participant.connectionId, // Keep connectionId for WebSocket messages
      userId: participant.userId ? participant.userId.substring(0, 8) + '...' : undefined
    }
  }

  /**
   * Handle API requests
   */
  private async handleJoinRequest(request: Request): Promise<Response> {
    // Implementation for HTTP-based joining (alternative to WebSocket)
    return new Response('Use WebSocket connection', { status: 400 })
  }

  private async handleLeaveRequest(request: Request): Promise<Response> {
    // Implementation for HTTP-based leaving
    return new Response('Use WebSocket connection', { status: 400 })
  }

  private async handleDocumentRequest(request: Request, action?: string): Promise<Response> {
    if (!this.room) {
      return new Response('Room not found', { status: 404 })
    }

    switch (request.method) {
      case 'GET':
        return new Response(JSON.stringify({
          room: this.room,
          metrics: this.metrics
        }), {
          headers: { 'Content-Type': 'application/json' }
        })

      default:
        return new Response('Method Not Allowed', { status: 405 })
    }
  }

  private async handleOperationsRequest(request: Request): Promise<Response> {
    if (!this.room) {
      return new Response('Room not found', { status: 404 })
    }

    if (request.method === 'GET') {
      const url = new URL(request.url)
      const fromRevision = parseInt(url.searchParams.get('from') || '0')

      const operations = this.room.document.operations.filter(
        op => op.revision > fromRevision
      )

      return new Response(JSON.stringify({ operations }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response('Method Not Allowed', { status: 405 })
  }

  private async handleHistoryRequest(request: Request): Promise<Response> {
    if (!this.room) {
      return new Response('Room not found', { status: 404 })
    }

    const history = {
      operations: this.room.document.operations,
      checkpoints: this.room.document.checkpoints,
      currentVersion: this.room.document.version
    }

    return new Response(JSON.stringify(history), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  private async handleExportRequest(request: Request): Promise<Response> {
    if (!this.room) {
      return new Response('Room not found', { status: 404 })
    }

    const url = new URL(request.url)
    const format = url.searchParams.get('format') || 'json'

    let exportData: any
    let contentType: string
    let filename: string

    switch (format) {
      case 'json':
        exportData = {
          room: {
            name: this.room.name,
            type: this.room.type,
            content: this.room.document.content,
            metadata: this.room.metadata
          }
        }
        contentType = 'application/json'
        filename = `${this.room.name}.json`
        break

      case 'txt':
        exportData = typeof this.room.document.content === 'string'
          ? this.room.document.content
          : JSON.stringify(this.room.document.content, null, 2)
        contentType = 'text/plain'
        filename = `${this.room.name}.txt`
        break

      default:
        return new Response('Unsupported format', { status: 400 })
    }

    return new Response(JSON.stringify(exportData), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  }

  private async handleAdminRequest(request: Request, action?: string): Promise<Response> {
    if (!action) {
      return new Response('Action required', { status: 400 })
    }

    // TODO: Add admin authentication
    switch (action) {
      case 'lock':
        if (this.room) {
          this.room.status = 'locked'
          await this.saveRoomToStorage()

          this.broadcastToAll({
            type: 'room_locked',
            timestamp: Date.now()
          })
        }
        return new Response(JSON.stringify({ success: true }))

      case 'unlock':
        if (this.room) {
          this.room.status = 'active'
          await this.saveRoomToStorage()

          this.broadcastToAll({
            type: 'room_unlocked',
            timestamp: Date.now()
          })
        }
        return new Response(JSON.stringify({ success: true }))

      case 'kick':
        const url = new URL(request.url)
        const connectionId = url.searchParams.get('connectionId')

        if (connectionId) {
          const websocket = this.connections.get(connectionId)
          if (websocket) {
            websocket.close(1000, 'Kicked by admin')
            this.connections.delete(connectionId)
            this.participants.delete(connectionId)
          }
        }
        return new Response(JSON.stringify({ success: true }))

      default:
        return new Response('Invalid action', { status: 400 })
    }
  }

  /**
   * Alarm handler for maintenance tasks
   */
  async alarm(): Promise<void> {
    try {
      // Cleanup inactive participants
      await this.cleanupInactiveParticipants()

      // Save current state
      await this.saveRoomToStorage()

      // Schedule next alarm
      await this.storage.setAlarm(Date.now() + 300000) // 5 minutes
    } catch (error) {
      console.error('Alarm error:', error)
    }
  }

  private async cleanupInactiveParticipants(): Promise<void> {
    const now = Date.now()
    const inactiveThreshold = 300000 // 5 minutes
    const inactiveParticipants: string[] = []

    for (const [connectionId, participant] of this.participants) {
      if (now - participant.lastActivity > inactiveThreshold) {
        inactiveParticipants.push(connectionId)
      }
    }

    for (const connectionId of inactiveParticipants) {
      const websocket = this.connections.get(connectionId)
      if (websocket) {
        websocket.close(1000, 'Inactive')
        this.connections.delete(connectionId)
        this.participants.delete(connectionId)
      }
    }

    if (inactiveParticipants.length > 0) {
      console.log(`Cleaned up ${inactiveParticipants.length} inactive participants`)
    }
  }

  private initializeAlarm(): void {
    // Set initial alarm if not already set
    this.storage.getAlarm().then(alarm => {
      if (!alarm) {
        this.storage.setAlarm(Date.now() + 300000) // 5 minutes
      }
    })
  }
}

// Factory function
export function createCollaborationRoomDurableObject(
  state: DurableObjectState,
  env: Env
): CollaborationRoomDurableObject {
  return new CollaborationRoomDurableObject(state, env)
}

export default CollaborationRoomDurableObject
