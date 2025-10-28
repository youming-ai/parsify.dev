/**
 * Durable Objects Module Index
 *
 * Exports all Durable Object implementations and related utilities
 * for session management and real-time collaboration.
 */

// Re-export configuration types
export type {
  DurableObjectConfig,
  DurableObjectHealthCheck,
  SessionData,
} from '../config/cloudflare/durable-objects-config'
// Utility functions
export * from '../services/session_service'
export type {
  DocumentState,
  Operation,
  Participant,
  RoomConfig,
  RoomEvent,
  RoomMessage as RoomMessageType,
} from './collaboration-room'
export {
  CollaborationRoomDurableObject,
  createCollaborationRoomDurableObject,
  default as CollaborationRoom,
} from './collaboration-room'
// Types and interfaces
export type {
  CollaborationRoom,
  EnhancedConnection,
  EnhancedSessionData,
  SessionEvent,
  SessionMessage as SessionMessageType,
} from './session-manager'
// Durable Object implementations
// Default exports
export {
  createSessionManagerDurableObject,
  default as SessionManager,
  SessionManagerDurableObject,
} from './session-manager'
// WebSocket message handlers
export {
  CollaborationMessageHandler,
  default as MessageHandlerManager,
  type HandlerContext,
  type HandlerResult,
  type MessageHandler,
  MessageHandlerManager,
  RoomMessageHandler,
  SessionMessageHandler,
  SystemMessageHandler,
  type WebSocketMessage,
} from './websocket-handlers'
