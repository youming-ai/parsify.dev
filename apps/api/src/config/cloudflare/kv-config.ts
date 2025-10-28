/**
 * Cloudflare KV Configuration
 *
 * This module provides configuration and utilities for interacting with
 * Cloudflare KV storage, including cache management, session storage,
 * and environment-specific settings.
 */

export interface KVConfig {
  binding: string
  namespaceId: string
  previewId?: string
  defaultTTL?: number
  maxTTL?: number
  enableGracePeriod?: boolean
  gracePeriod?: number
  enableMetadata?: boolean
  enableCompression?: boolean
  cacheSize?: number
  enableHealthCheck?: boolean
  healthCheckInterval?: number
}

export interface KVEnvironmentConfig {
  development: KVConfig
  production: KVConfig
  staging?: KVConfig
}

export interface KVNamespaceConfig {
  cache: KVConfig
  sessions: KVConfig
  uploads: KVConfig
  analytics: KVConfig
}

export const DEFAULT_KV_CONFIG: Partial<KVConfig> = {
  defaultTTL: 3600, // 1 hour
  maxTTL: 2592000, // 30 days (maximum allowed by Cloudflare)
  enableGracePeriod: true,
  gracePeriod: 86400, // 1 day
  enableMetadata: true,
  enableCompression: true,
  cacheSize: 1000,
  enableHealthCheck: true,
  healthCheckInterval: 300000, // 5 minutes
}

export const KV_ENVIRONMENT_CONFIG: KVEnvironmentConfig = {
  development: {
    binding: 'CACHE',
    namespaceId: 'local',
    previewId: 'local',
    ...DEFAULT_KV_CONFIG,
  },
  production: {
    binding: 'CACHE',
    namespaceId: process.env.CLOUDFLARE_KV_NAMESPACE_ID || '',
    defaultTTL: 1800, // 30 minutes for production
    enableCompression: true,
    cacheSize: 5000,
    healthCheckInterval: 120000, // 2 minutes
    ...DEFAULT_KV_CONFIG,
  },
}

export const KV_NAMESPACES: KVNamespaceConfig = {
  cache: {
    binding: 'CACHE',
    namespaceId: process.env.CLOUDFLARE_KV_CACHE_ID || 'local',
    defaultTTL: 1800, // 30 minutes
    enableGracePeriod: true,
    ...DEFAULT_KV_CONFIG,
  },
  sessions: {
    binding: 'SESSIONS',
    namespaceId: process.env.CLOUDFLARE_KV_SESSIONS_ID || 'local',
    defaultTTL: 86400, // 24 hours
    maxTTL: 604800, // 7 days
    enableGracePeriod: true,
    gracePeriod: 3600, // 1 hour
    ...DEFAULT_KV_CONFIG,
  },
  uploads: {
    binding: 'UPLOADS',
    namespaceId: process.env.CLOUDFLARE_KV_UPLOADS_ID || 'local',
    defaultTTL: 3600, // 1 hour
    maxTTL: 86400, // 24 hours
    enableCompression: false, // Don't compress file metadata
    ...DEFAULT_KV_CONFIG,
  },
  analytics: {
    binding: 'ANALYTICS',
    namespaceId: process.env.CLOUDFLARE_KV_ANALYTICS_ID || 'local',
    defaultTTL: 2592000, // 30 days
    maxTTL: 2592000,
    enableCompression: true,
    ...DEFAULT_KV_CONFIG,
  },
}

export function getKVConfig(namespace: keyof KVNamespaceConfig, environment?: string): KVConfig {
  const env = environment || process.env.ENVIRONMENT || 'development'
  const baseConfig = KV_NAMESPACES[namespace]

  if (env === 'production' && !baseConfig.namespaceId) {
    throw new Error(
      `Cloudflare KV namespace ID is required for ${namespace} in production environment`
    )
  }

  return baseConfig
}

export interface KVHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: number
  responseTime: number
  error?: string
  namespace: string
  details?: {
    operationsCount: number
    cacheHitRate: number
    avgResponseTime: number
    errorRate: number
  }
}

export class KVHealthMonitor {
  private configs: Record<string, KVConfig>
  private healthChecks: Record<string, KVHealthCheck | null> = {}
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null
  private isMonitoring = false
  private operations: Record<
    string,
    {
      total: number
      errors: number
      totalTime: number
    }
  > = {}

  constructor(configs: Record<string, KVConfig>) {
    this.configs = configs
    Object.keys(configs).forEach(namespace => {
      this.healthChecks[namespace] = null
      this.operations[namespace] = { total: 0, errors: 0, totalTime: 0 }
    })
  }

  async startMonitoring(kvNamespaces: Record<string, KVNamespace>): Promise<void> {
    if (this.isMonitoring) return

    this.isMonitoring = true

    // Initial health checks
    for (const [namespace, kv] of Object.entries(kvNamespaces)) {
      await this.performHealthCheck(namespace, kv)
    }

    // Set up periodic health checks
    const minInterval = Math.min(
      ...Object.values(this.configs).map(config => config.healthCheckInterval || 300000)
    )

    this.healthCheckTimer = setInterval(
      () => this.performAllHealthChecks(kvNamespaces),
      minInterval
    )
  }

  async stopMonitoring(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
      this.healthCheckTimer = null
    }
    this.isMonitoring = false
  }

  async performHealthCheck(namespace: string, kv: KVNamespace): Promise<KVHealthCheck> {
    const startTime = Date.now()
    const testKey = `health-check-${Date.now()}`
    const testValue = 'ok'

    try {
      // Test write and read
      await kv.put(testKey, testValue, { expirationTtl: 60 })
      const result = await kv.get(testKey)
      await kv.delete(testKey)

      const responseTime = Date.now() - startTime
      const success = result === testValue

      const healthCheck: KVHealthCheck = {
        status: success && responseTime < 1000 ? 'healthy' : 'degraded',
        timestamp: Date.now(),
        responseTime,
        namespace,
        details: this.calculateOperationStats(namespace),
      }

      this.healthChecks[namespace] = healthCheck
      this.recordOperation(namespace, responseTime, true)

      return healthCheck
    } catch (error) {
      const healthCheck: KVHealthCheck = {
        status: 'unhealthy',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
        namespace,
        error: error instanceof Error ? error.message : 'Unknown error',
      }

      this.healthChecks[namespace] = healthCheck
      this.recordOperation(namespace, Date.now() - startTime, false)

      return healthCheck
    }
  }

  private async performAllHealthChecks(kvNamespaces: Record<string, KVNamespace>): Promise<void> {
    for (const [namespace, kv] of Object.entries(kvNamespaces)) {
      await this.performHealthCheck(namespace, kv)
    }
  }

  private recordOperation(namespace: string, responseTime: number, success: boolean): void {
    const ops = this.operations[namespace]
    if (ops) {
      ops.total++
      if (!success) ops.errors++
      ops.totalTime += responseTime

      // Keep only recent operations (last 1000)
      if (ops.total > 1000) {
        ops.total = Math.floor(ops.total / 2)
        ops.errors = Math.floor(ops.errors / 2)
        ops.totalTime = Math.floor(ops.totalTime / 2)
      }
    }
  }

  private calculateOperationStats(namespace: string) {
    const ops = this.operations[namespace]
    if (!ops || ops.total === 0) {
      return {
        operationsCount: 0,
        cacheHitRate: 0,
        avgResponseTime: 0,
        errorRate: 0,
      }
    }

    return {
      operationsCount: ops.total,
      cacheHitRate: 95, // Simplified - KV doesn't provide hit rate
      avgResponseTime: Math.round(ops.totalTime / ops.total),
      errorRate: Math.round((ops.errors / ops.total) * 100),
    }
  }

  getLastHealthCheck(namespace: string): KVHealthCheck | null {
    return this.healthChecks[namespace] || null
  }

  isHealthy(namespace?: string): boolean {
    if (namespace) {
      const lastCheck = this.getLastHealthCheck(namespace)
      if (!lastCheck) return false

      const maxAge = (this.configs[namespace]?.healthCheckInterval || 300000) * 2
      const isRecent = Date.now() - lastCheck.timestamp < maxAge

      return isRecent && lastCheck.status !== 'unhealthy'
    }

    // Check all namespaces
    return Object.keys(this.configs).every(ns => this.isHealthy(ns))
  }
}

// KV utilities
export interface KVOptions {
  ttl?: number
  expiration?: number
  metadata?: Record<string, unknown>
  cacheTtl?: number
}

export interface KVCacheEntry<T = unknown> {
  data: T
  timestamp: number
  ttl?: number
  metadata?: Record<string, unknown>
  version: string
}

export class KVCacheService {
  private kv: KVNamespace
  private config: KVConfig
  private keyPrefix: string

  constructor(kv: KVNamespace, config: KVConfig, keyPrefix = 'cache') {
    this.kv = kv
    this.config = config
    this.keyPrefix = keyPrefix
  }

  private getKey(key: string): string {
    return `${this.keyPrefix}:${key}`
  }

  private createCacheEntry<T>(data: T, options: KVOptions = {}): string {
    const entry: KVCacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: options.ttl || this.config.defaultTTL,
      metadata: options.metadata,
      version: '1.0',
    }

    return JSON.stringify(entry)
  }

  private parseCacheEntry<T>(value: string | null): KVCacheEntry<T> | null {
    if (!value) return null

    try {
      const entry = JSON.parse(value) as KVCacheEntry<T>

      // Check if expired
      if (entry.ttl && Date.now() - entry.timestamp > entry.ttl * 1000) {
        return null
      }

      return entry
    } catch {
      return null
    }
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const value = await this.kv.get(this.getKey(key))
      const entry = this.parseCacheEntry<T>(value)

      return entry?.data || null
    } catch (error) {
      console.error('KV get error:', error)
      return null
    }
  }

  async set<T = unknown>(key: string, data: T, options: KVOptions = {}): Promise<void> {
    try {
      const value = this.createCacheEntry(data, options)
      const kvOptions: KVNamespacePutOptions = {}

      if (options.ttl || this.config.defaultTTL) {
        kvOptions.expirationTtl = options.ttl || this.config.defaultTTL
      }

      if (options.expiration) {
        kvOptions.expiration = options.expiration
      }

      if (options.metadata || this.config.enableMetadata) {
        kvOptions.metadata = {
          ...options.metadata,
          timestamp: Date.now(),
          keyPrefix: this.keyPrefix,
        }
      }

      await this.kv.put(this.getKey(key), value, kvOptions)
    } catch (error) {
      console.error('KV set error:', error)
      throw error
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.kv.delete(this.getKey(key))
      return true
    } catch (error) {
      console.error('KV delete error:', error)
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const value = await this.kv.get(this.getKey(key))
      return value !== null
    } catch (error) {
      console.error('KV exists error:', error)
      return false
    }
  }

  async clear(pattern?: string): Promise<void> {
    try {
      const prefix = pattern ? `${this.keyPrefix}:${pattern}` : this.keyPrefix
      const list = await this.kv.list({ prefix })

      const deletePromises = list.keys.map(key => this.kv.delete(key.name))
      await Promise.allSettled(deletePromises)
    } catch (error) {
      console.error('KV clear error:', error)
      throw error
    }
  }

  async getMultiple<T = unknown>(keys: string[]): Promise<Record<string, T | null>> {
    const results: Record<string, T | null> = {}

    const promises = keys.map(async key => {
      const value = await this.get<T>(key)
      results[key] = value
    })

    await Promise.allSettled(promises)
    return results
  }

  async setMultiple<T = unknown>(
    entries: Array<{ key: string; data: T; options?: KVOptions }>
  ): Promise<void> {
    const promises = entries.map(({ key, data, options }) => this.set(key, data, options))

    await Promise.allSettled(promises)
  }

  // Cache with automatic refresh
  async getWithRefresh<T = unknown>(
    key: string,
    refreshFn: () => Promise<T>,
    options: KVOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key)

    if (cached) {
      // Check if we should refresh in background
      const entry = await this.kv.get(this.getKey(key), 'text')
      const parsed = this.parseCacheEntry<T>(entry)

      if (parsed?.ttl) {
        const age = Date.now() - parsed.timestamp
        const refreshThreshold = parsed.ttl * 1000 * 0.8 // Refresh at 80% of TTL

        if (age > refreshThreshold) {
          // Refresh in background
          refreshFn()
            .then(data => {
              this.set(key, data, options).catch(console.error)
            })
            .catch(console.error)
        }
      }

      return cached
    }

    // Cache miss - fetch and store
    const data = await refreshFn()
    await this.set(key, data, options)
    return data
  }
}

// Session management utilities
export interface SessionData {
  userId?: string
  ipAddress?: string
  userAgent?: string
  data: Record<string, unknown>
  createdAt: number
  lastAccessed: number
  expiresAt: number
}

export class KVSessionService {
  private kv: KVNamespace
  private config: KVConfig

  constructor(kv: KVNamespace, config: KVConfig) {
    this.kv = kv
    this.config = config
  }

  private getSessionKey(sessionId: string): string {
    return `session:${sessionId}`
  }

  private getUserSessionKey(userId: string): string {
    return `user_sessions:${userId}`
  }

  async createSession(
    sessionId: string,
    data: Record<string, unknown>,
    options: {
      ttl?: number
      userId?: string
      ipAddress?: string
      userAgent?: string
    } = {}
  ): Promise<void> {
    const now = Date.now()
    const ttl = options.ttl || this.config.defaultTTL || 86400 // 24 hours default

    const sessionData: SessionData = {
      userId: options.userId,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      data,
      createdAt: now,
      lastAccessed: now,
      expiresAt: now + ttl * 1000,
    }

    await this.kv.put(this.getSessionKey(sessionId), JSON.stringify(sessionData), {
      expirationTtl: ttl,
    })

    // Track user sessions if userId provided
    if (options.userId) {
      await this.addUserSession(options.userId, sessionId, ttl)
    }
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const value = await this.kv.get(this.getSessionKey(sessionId))
      if (!value) return null

      const sessionData = JSON.parse(value) as SessionData

      // Check if expired
      if (Date.now() > sessionData.expiresAt) {
        await this.deleteSession(sessionId)
        return null
      }

      // Update last accessed time
      sessionData.lastAccessed = Date.now()
      await this.updateSession(sessionId, sessionData)

      return sessionData
    } catch (error) {
      console.error('Session get error:', error)
      return null
    }
  }

  async updateSession(sessionId: string, data: Partial<SessionData>): Promise<void> {
    const current = await this.getSession(sessionId)
    if (!current) throw new Error('Session not found')

    const updated: SessionData = {
      ...current,
      ...data,
      lastAccessed: Date.now(),
    }

    const remainingTtl = Math.max(0, Math.floor((updated.expiresAt - Date.now()) / 1000))

    await this.kv.put(this.getSessionKey(sessionId), JSON.stringify(updated), {
      expirationTtl: remainingTtl || 1,
    })
  }

  async deleteSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId)
    if (session?.userId) {
      await this.removeUserSession(session.userId, sessionId)
    }

    await this.kv.delete(this.getSessionKey(sessionId))
  }

  async getUserSessions(userId: string): Promise<string[]> {
    try {
      const value = await this.kv.get(this.getUserSessionKey(userId))
      return value ? JSON.parse(value) : []
    } catch (error) {
      console.error('Get user sessions error:', error)
      return []
    }
  }

  private async addUserSession(userId: string, sessionId: string, ttl: number): Promise<void> {
    const sessions = await this.getUserSessions(userId)

    if (!sessions.includes(sessionId)) {
      sessions.push(sessionId)

      await this.kv.put(this.getUserSessionKey(userId), JSON.stringify(sessions), {
        expirationTtl: ttl,
      })
    }
  }

  private async removeUserSession(userId: string, sessionId: string): Promise<void> {
    const sessions = await this.getUserSessions(userId)
    const index = sessions.indexOf(sessionId)

    if (index > -1) {
      sessions.splice(index, 1)

      if (sessions.length > 0) {
        await this.kv.put(this.getUserSessionKey(userId), JSON.stringify(sessions))
      } else {
        await this.kv.delete(this.getUserSessionKey(userId))
      }
    }
  }

  async clearUserSessions(userId: string): Promise<void> {
    const sessions = await this.getUserSessions(userId)

    const deletePromises = sessions.map(sessionId => this.deleteSession(sessionId))

    await Promise.allSettled(deletePromises)
  }

  async cleanupExpiredSessions(): Promise<number> {
    // This would need to be implemented with a list operation
    // For now, rely on KV's automatic expiration
    return 0
  }
}
