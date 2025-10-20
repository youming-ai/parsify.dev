/**
 * Cloudflare Services Index
 *
 * This module exports all Cloudflare service configurations and abstractions
 * for easy access throughout the application.
 */

// Configuration modules
export * from '../../config/cloudflare/d1-config'
export * from '../../config/cloudflare/kv-config'
export * from '../../config/cloudflare/r2-config'
export * from '../../config/cloudflare/durable-objects-config'

// Service implementations
export * from './cloudflare-service'
export * from './r2-storage'
export * from './r2-file-service-integration'
export * from './images'

// Re-export commonly used types and functions
export type {
  D1Config,
  D1HealthCheck,
  D1ConnectionPool,
} from '../../config/cloudflare/d1-config'

export type {
  KVConfig,
  KVHealthCheck,
  SessionData,
  KVCacheEntry,
} from '../../config/cloudflare/kv-config'

export type {
  R2Config,
  R2HealthCheck,
  R2FileMetadata,
  R2UploadOptions,
} from '../../config/cloudflare/r2-config'

export type {
  DurableObjectConfig,
  SessionData as DOSessionData,
  SessionMessage,
  DurableObjectHealthCheck,
} from '../../config/cloudflare/durable-objects-config'

export type {
  CloudflareServiceOptions,
  CloudflareServiceHealth,
  CloudflareServiceMetrics,
} from './cloudflare-service'

// Convenience exports
export {
  getD1Config,
  getKVConfig,
  getR2Config,
  getDurableObjectConfig,
  createCloudflareService,
  CloudflareService,
} from './cloudflare-service'
