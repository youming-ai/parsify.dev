/**
 * Cloudflare Configuration Index
 *
 * Central export point for all Cloudflare service configurations and utilities.
 */

// Service Wrapper
export {
  CloudflareService,
  CloudflareServiceHealth,
  CloudflareServiceMetrics,
  CloudflareServiceOptions,
  createCloudflareService,
} from '../../services/cloudflare/cloudflare-service'
// D1 Database
export {
  createD1Pool,
  D1_ENVIRONMENT_CONFIG,
  D1Config,
  D1ConnectionPool,
  D1EnvironmentConfig,
  D1HealthCheck,
  D1HealthMonitor,
  D1Migrator,
  DEFAULT_D1_CONFIG,
  executeQuery,
  getD1Config,
  Migration,
  QueryOptions,
  SimpleD1Pool,
} from './d1-config'
// Durable Objects
export {
  createSessionManagerDurableObject,
  DEFAULT_DURABLE_OBJECT_CONFIG,
  DURABLE_OBJECT_ENVIRONMENT_CONFIG,
  DurableObjectConfig,
  DurableObjectEnvironmentConfig,
  DurableObjectHealthCheck,
  getDurableObjectConfig,
  SessionData as DOSessionData,
  SessionManagerDurableObject,
  SessionMessage,
} from './durable-objects-config'
// KV Storage
export {
  DEFAULT_KV_CONFIG,
  getKVConfig,
  KV_ENVIRONMENT_CONFIG,
  KV_NAMESPACES,
  KVCacheEntry,
  KVCacheService,
  KVConfig,
  KVEnvironmentConfig,
  KVHealthCheck,
  KVHealthMonitor,
  KVNamespaceConfig,
  KVOptions,
  KVSessionService,
  SessionData,
} from './kv-config'
// R2 Object Storage
export {
  DEFAULT_R2_CONFIG,
  getR2Config,
  R2_ENVIRONMENT_CONFIG,
  R2Config,
  R2EnvironmentConfig,
  R2FileMetadata,
  R2FileService,
  R2HealthCheck,
  R2HealthMonitor,
  R2UploadOptions,
} from './r2-config'

// Environment utilities
export function getEnvironment(): string {
  return process.env.ENVIRONMENT || 'development'
}

export function isProduction(): boolean {
  return getEnvironment() === 'production'
}

export function isDevelopment(): boolean {
  return getEnvironment() === 'development'
}

export function isStaging(): boolean {
  return getEnvironment() === 'staging'
}

// Common utilities
export function createServiceKey(prefix: string, identifier: string): string {
  return `${prefix}:${identifier}`
}

export function parseServiceKey(key: string): {
  prefix: string
  identifier: string
} {
  const [prefix, ...identifierParts] = key.split(':')
  return {
    prefix,
    identifier: identifierParts.join(':'),
  }
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function generateShortId(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Validation utilities
export function validateEnvironmentConfig(): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  const env = getEnvironment()

  try {
    // Validate D1 config
    const d1Config = getD1Config(env)
    if (env === 'production' && !d1Config.databaseId) {
      errors.push('D1 database ID is required for production')
    }
  } catch (error) {
    errors.push(`D1 configuration error: ${error}`)
  }

  try {
    // Validate KV configs
    const kvNamespaces = ['cache', 'sessions', 'uploads', 'analytics']
    for (const namespace of kvNamespaces) {
      const kvConfig = getKVConfig(namespace as 'cache' | 'sessions' | 'uploads' | 'analytics', env)
      if (env === 'production' && !kvConfig.namespaceId) {
        errors.push(`KV namespace ID is required for ${namespace} in production`)
      }
    }
  } catch (error) {
    errors.push(`KV configuration error: ${error}`)
  }

  try {
    // Validate R2 config
    const r2Config = getR2Config(env)
    if (env === 'production' && !r2Config.bucketName) {
      errors.push('R2 bucket name is required for production')
    }
  } catch (error) {
    errors.push(`R2 configuration error: ${error}`)
  }

  try {
    // Validate Durable Object configs
    const doNames = ['sessionManager', 'collaborationRoom', 'realtimeSync']
    for (const doName of doNames) {
      getDurableObjectConfig(doName, env)
    }
  } catch (error) {
    errors.push(`Durable Object configuration error: ${error}`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
