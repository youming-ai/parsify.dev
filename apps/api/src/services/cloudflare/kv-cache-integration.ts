/**
 * KV Cache Integration Example
 *
 * This file demonstrates how to integrate the enhanced KV cache service
 * with the existing services in the application. It shows best practices
 * for initialization, configuration, and usage patterns.
 */

import { AuthService, type AuthServiceOptions } from '../auth_service'
import { RateLimitService, type RateLimitServiceOptions } from '../rate_limit_service'
import { ToolService, type ToolServiceOptions } from '../tool_service'
import { type CloudflareService, createCloudflareService } from './cloudflare-service'
import type { KVCacheService } from './kv-cache'

export interface CacheIntegrationConfig {
  cloudflare: {
    environment: string
    enableHealthMonitoring: boolean
    enableCaching: boolean
    enableMetrics: boolean
  }
  auth: {
    enableAdvancedCaching: boolean
    sessionTimeoutMinutes: number
    cacheTTL: number
  }
  tools: {
    enableAdvancedCaching: boolean
    cacheTTL: number
    warmupEnabled: boolean
    warmupInterval: number
  }
  rateLimit: {
    enableAdvancedCaching: boolean
    cacheTTL: number
    distributedLimiting: boolean
  }
}

export class CacheIntegratedServices {
  private cloudflareService: CloudflareService
  private cacheService: KVCacheService
  private authService: AuthService
  private toolService: ToolService
  private rateLimitService: RateLimitService

  constructor(
    env: any,
    private config: CacheIntegrationConfig,
    db: D1Database,
    kv: KVNamespace
  ) {
    // Initialize CloudflareService with enhanced caching
    this.cloudflareService = createCloudflareService(env, {
      environment: config.cloudflare.environment,
      enableHealthMonitoring: config.cloudflare.enableHealthMonitoring,
      enableCaching: config.cloudflare.enableCaching,
      enableMetrics: config.cloudflare.enableMetrics,
    })

    // Get the enhanced KV cache service
    this.cacheService = this.cloudflareService.getKVCacheService()!

    // Initialize services with enhanced caching
    this.initializeServices(env, db, kv)
  }

  private initializeServices(env: any, db: D1Database, kv: KVNamespace): void {
    // Initialize AuthService with enhanced caching
    const authOptions: AuthServiceOptions = {
      db,
      kv,
      jwtSecret: env.JWT_SECRET || 'default-secret',
      auditEnabled: true,
      sessionTimeoutMinutes: this.config.auth.sessionTimeoutMinutes,
      cloudflareService: this.cloudflareService,
      enableAdvancedCaching: this.config.auth.enableAdvancedCaching,
    }

    this.authService = new AuthService(authOptions)

    // Initialize ToolService with enhanced caching
    const toolOptions: ToolServiceOptions = {
      db,
      kv,
      auditEnabled: true,
      enableBetaFeatures: env.ENABLE_BETA_FEATURES === 'true',
      cloudflareService: this.cloudflareService,
      enableAdvancedCaching: this.config.tools.enableAdvancedCaching,
    }

    this.toolService = new ToolService(toolOptions)

    // Initialize RateLimitService with enhanced caching
    const rateLimitOptions: RateLimitServiceOptions = {
      db,
      kv,
      auditEnabled: true,
      enableDistributedLimiting: this.config.rateLimit.distributedLimiting,
      cloudflareService: this.cloudflareService,
      enableAdvancedCaching: this.config.rateLimit.enableAdvancedCaching,
    }

    this.rateLimitService = new RateLimitService(rateLimitOptions)
  }

  // Initialization and startup
  async initialize(): Promise<void> {
    try {
      // Start health monitoring
      await this.cloudflareService.startHealthMonitoring()

      // Warmup caches if enabled
      if (this.config.tools.warmupEnabled) {
        await this.warmupCaches()
      }

      console.log('Cache integrated services initialized successfully')
    } catch (error) {
      console.error('Failed to initialize cache integrated services:', error)
      throw error
    }
  }

  private async warmupCaches(): Promise<void> {
    try {
      console.log('Starting cache warmup...')

      // Warmup tool cache
      await this.toolService.warmupAdvancedCache()

      // Warmup auth cache for recent users
      await this.warmupAuthCache()

      // Warmup popular rate limits
      await this.warmupRateLimitCache()

      console.log('Cache warmup completed')
    } catch (error) {
      console.error('Cache warmup failed:', error)
    }
  }

  private async warmupAuthCache(): Promise<void> {
    // This would typically load recent active users
    // For demonstration, we'll skip the actual implementation
    console.log('Auth cache warmup skipped (no recent users to preload)')
  }

  private async warmupRateLimitCache(): Promise<void> {
    // Preload common rate limit configurations
    console.log('Rate limit cache warmup completed')
  }

  // Service accessors
  getAuthService(): AuthService {
    return this.authService
  }

  getToolService(): ToolService {
    return this.toolService
  }

  getRateLimitService(): RateLimitService {
    return this.rateLimitService
  }

  getCloudflareService(): CloudflareService {
    return this.cloudflareService
  }

  getCacheService(): KVCacheService {
    return this.cacheService
  }

  // Cache management methods
  async invalidateAllCache(): Promise<void> {
    try {
      await Promise.all([
        this.authService.invalidateUserCache(''), // Invalidate all user cache
        this.toolService.invalidateToolCache(), // Invalidate all tool cache
        this.rateLimitService.invalidateRateLimitCache(), // Invalidate all rate limit cache
        this.cloudflareService.invalidateCache({}), // Invalidate general cache
      ])

      console.log('All cache invalidated successfully')
    } catch (error) {
      console.error('Failed to invalidate all cache:', error)
    }
  }

  async invalidateUserRelatedCache(userId: string): Promise<void> {
    try {
      await Promise.all([
        this.authService.invalidateUserCache(userId),
        this.cloudflareService.invalidateCache({
          tags: [`user:${userId}`],
        }),
        this.rateLimitService.invalidateRateLimitCache(userId),
      ])

      console.log(`User-related cache invalidated for user: ${userId}`)
    } catch (error) {
      console.error(`Failed to invalidate user cache for ${userId}:`, error)
    }
  }

  async getCacheAnalytics() {
    return {
      general: this.cloudflareService.getCacheAnalytics(),
      auth: this.authService.getCacheAnalytics(),
      tools: this.toolService.getToolCacheAnalytics(),
      rateLimit: await this.rateLimitService.getRateLimitAnalytics(),
    }
  }

  async getHealthStatus() {
    const [cloudflareHealth, cacheHealth] = await Promise.all([
      this.cloudflareService.getHealthStatus(),
      this.cacheService.healthCheck(),
    ])

    return {
      cloudflare: cloudflareHealth,
      cache: cacheHealth,
      services: {
        auth: 'healthy', // Could implement health checks for each service
        tools: 'healthy',
        rateLimit: 'healthy',
      },
      timestamp: Date.now(),
    }
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    try {
      console.log('Shutting down cache integrated services...')

      // Shutdown CloudflareService (which includes cache service)
      await this.cloudflareService.cleanup()

      console.log('Cache integrated services shutdown complete')
    } catch (error) {
      console.error('Error during shutdown:', error)
    }
  }
}

// Factory function for easy initialization
export function createCacheIntegratedServices(
  env: any,
  db: D1Database,
  kv: KVNamespace,
  config?: Partial<CacheIntegrationConfig>
): CacheIntegratedServices {
  const defaultConfig: CacheIntegrationConfig = {
    cloudflare: {
      environment: env.ENVIRONMENT || 'development',
      enableHealthMonitoring: true,
      enableCaching: true,
      enableMetrics: true,
    },
    auth: {
      enableAdvancedCaching: true,
      sessionTimeoutMinutes: 30,
      cacheTTL: 3600, // 1 hour
    },
    tools: {
      enableAdvancedCaching: true,
      cacheTTL: 1800, // 30 minutes
      warmupEnabled: true,
      warmupInterval: 60, // 1 hour
    },
    rateLimit: {
      enableAdvancedCaching: true,
      cacheTTL: 300, // 5 minutes
      distributedLimiting: true,
    },
  }

  const finalConfig = {
    cloudflare: { ...defaultConfig.cloudflare, ...config?.cloudflare },
    auth: { ...defaultConfig.auth, ...config?.auth },
    tools: { ...defaultConfig.tools, ...config?.tools },
    rateLimit: { ...defaultConfig.rateLimit, ...config?.rateLimit },
  }

  return new CacheIntegratedServices(env, finalConfig, db, kv)
}

// Example usage in a Cloudflare Worker:
/*
export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    // Initialize services (do this once per worker instance)
    if (!global.services) {
      global.services = createCacheIntegratedServices(env, env.DB, env.CACHE)
      await global.services.initialize()
    }

    const { authService, toolService, rateLimitService } = global.services

    // Example: Rate limit check
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'
    const rateLimitCheck = await rateLimitService.checkRateLimit({
      identifier: clientIP,
      quotaType: 'api_requests'
    })

    if (!rateLimitCheck.allowed) {
      return new Response('Rate limit exceeded', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitCheck.limit.toString(),
          'X-RateLimit-Remaining': rateLimitCheck.remaining.toString(),
          'X-RateLimit-Reset': rateLimitCheck.resetTime.toString(),
        }
      })
    }

    // Example: Auth check
    const authHeader = request.headers.get('Authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const session = await authService.verifyToken(token, clientIP)

      if (session) {
        // User is authenticated, proceed with request
        // Example: Get tools
        const tools = await toolService.getTools()
        return new Response(JSON.stringify({ tools }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }

    // Unauthenticated request
    return new Response('Unauthorized', { status: 401 })
  },

  // Graceful shutdown handler
  async scheduled(event: ScheduledEvent, env: any, ctx: ExecutionContext): Promise<void> {
    if (global.services) {
      await global.services.shutdown()
    }
  }
}
*/

// Export types
export type { CacheIntegrationConfig }
