/**
 * Cloudflare Services Index
 *
 * This module exports all Cloudflare service configurations and abstractions
 * for easy access throughout the application.
 */

// Re-export commonly used types and functions
export type {
  D1Config,
  D1ConnectionPool,
  D1HealthCheck,
} from '../../config/cloudflare/d1-config'
// Configuration modules
export * from '../../config/cloudflare/d1-config'
export type {
  DurableObjectConfig,
  DurableObjectHealthCheck,
  SessionData as DOSessionData,
  SessionMessage,
} from '../../config/cloudflare/durable-objects-config'
export * from '../../config/cloudflare/durable-objects-config'
export type {
  KVCacheEntry,
  KVConfig,
  KVHealthCheck,
  SessionData,
} from '../../config/cloudflare/kv-config'
export * from '../../config/cloudflare/kv-config'
export type {
  R2Config,
  R2FileMetadata,
  R2HealthCheck,
  R2UploadOptions,
} from '../../config/cloudflare/r2-config'
export * from '../../config/cloudflare/r2-config'
export type {
  CloudflareServiceHealth,
  CloudflareServiceMetrics,
  CloudflareServiceOptions,
} from './cloudflare-service'
// Service implementations
export * from './cloudflare-service'
// Convenience exports
export {
  CloudflareService,
  createCloudflareService,
  getD1Config,
  getDurableObjectConfig,
  getKVConfig,
  getR2Config,
} from './cloudflare-service'
export * from './images'
export * from './r2-file-service-integration'
export * from './r2-storage'
