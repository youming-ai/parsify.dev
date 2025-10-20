/**
 * Durable Objects Module Index
 *
 * Exports all Durable Object implementations and related utilities
 * for session management and real-time collaboration.
 */

// Durable Object implementations
export {
  SessionManagerDurableObject,
  createSessionManagerDurableObject,
} from './session-manager'
export {
  CollaborationRoomDurableObject,
  createCollaborationRoomDurableObject,
} from './collaboration-room'

// WebSocket message handlers
export {
  MessageHandlerManager,
  SessionMessageHandler,
  CollaborationMessageHandler,
  SystemMessageHandler,
  RoomMessageHandler,
  type WebSocketMessage,
  type HandlerContext,
  type HandlerResult,
  type MessageHandler,
} from './websocket-handlers'

// Types and interfaces
export type {
  EnhancedSessionData,
  EnhancedConnection,
  CollaborationRoom,
  SessionEvent,
  SessionMessage as SessionMessageType,
} from './session-manager'

export type {
  Participant,
  Operation,
  DocumentState,
  RoomConfig,
  RoomEvent,
  RoomMessage as RoomMessageType,
} from './collaboration-room'

// Re-export configuration types
export type {
  DurableObjectConfig,
  SessionData,
  DurableObjectHealthCheck,
} from '../config/cloudflare/durable-objects-config'

// Utility functions
export * from '../services/session_service'

// Default exports
export { default as SessionManager } from './session-manager'
export { default as CollaborationRoom } from './collaboration-room'
export { default as MessageHandlerManager } from './websocket-handlers'
