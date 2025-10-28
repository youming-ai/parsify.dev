import { createDatabaseClient, type DatabaseClient, IsolationLevel } from '../database'
import { AUDIT_LOG_QUERIES, AuditLog } from '../models/audit_log'
import {
  AUTH_IDENTITY_QUERIES,
  AuthIdentity,
  type GitHubProviderData,
  type GoogleProviderData,
  type OAuth2ProviderData,
} from '../models/auth_identity'
import { User } from '../models/user'
import type { CloudflareService } from './cloudflare/cloudflare-service'
import type { KVCacheService } from './cloudflare/kv-cache'

export interface AuthServiceOptions {
  db: D1Database
  kv: KVNamespace
  jwtSecret: string
  auditEnabled?: boolean
  sessionTimeoutMinutes?: number
  databaseConfig?: {
    maxConnections?: number
    connectionTimeoutMs?: number
    retryAttempts?: number
    enableMetrics?: boolean
  }
  cloudflareService?: CloudflareService
  enableAdvancedCaching?: boolean
}

export interface OAuthProviderConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
}

export interface AuthProviders {
  google?: OAuthProviderConfig
  github?: OAuthProviderConfig
  oauth2?: OAuthProviderConfig
}

export interface SessionData {
  sessionId: string
  userId?: string
  ipAddress: string
  userAgent: string
  createdAt: number
  lastAccessAt: number
  tier?: 'free' | 'pro' | 'enterprise'
}

export interface AuthResult {
  success: boolean
  user?: User
  sessionId?: string
  isNewUser?: boolean
  error?: string
}

export interface TokenPayload {
  sessionId: string
  userId?: string
  ipAddress: string
  tier?: string
  exp: number
  iat: number
}

export class AuthService {
  private db: D1Database
  private client: DatabaseClient
  private kv: KVNamespace
  private jwtSecret: string
  private auditEnabled: boolean
  private sessionTimeoutMinutes: number
  private providers: AuthProviders
  private cloudflareService: CloudflareService | null
  private cacheService: KVCacheService | null
  private enableAdvancedCaching: boolean

  constructor(options: AuthServiceOptions) {
    this.db = options.db
    this.client = createDatabaseClient(this.db, options.databaseConfig)
    this.kv = options.kv
    this.jwtSecret = options.jwtSecret
    this.auditEnabled = options.auditEnabled ?? true
    this.sessionTimeoutMinutes = options.sessionTimeoutMinutes ?? 30
    this.providers = {}
    this.cloudflareService = options.cloudflareService || null
    this.enableAdvancedCaching = options.enableAdvancedCaching ?? true
    this.cacheService = this.cloudflareService?.getKVCacheService() || null
  }

  // Provider configuration
  configureProviders(providers: AuthProviders): void {
    this.providers = providers
  }

  // OAuth authentication flows
  async authenticateWithGoogle(
    code: string,
    ipAddress: string,
    userAgent: string
  ): Promise<AuthResult> {
    if (!this.providers.google) {
      return { success: false, error: 'Google OAuth not configured' }
    }

    try {
      // Exchange authorization code for tokens
      const tokenData = await this.exchangeGoogleCode(code)
      if (!tokenData.access_token) {
        return { success: false, error: 'Failed to obtain access token' }
      }

      // Get user profile from Google
      const userProfile = await this.getGoogleUserProfile(tokenData.access_token)
      if (!userProfile.email) {
        return { success: false, error: 'Failed to obtain user profile' }
      }

      // Find or create user
      const result = await this.findOrCreateUserFromOAuth(
        'google',
        userProfile.sub,
        userProfile.email,
        userProfile.name,
        userProfile.picture,
        ipAddress,
        userAgent
      )

      if (!result.success) {
        return result
      }

      // Create auth identity if it doesn't exist
      if (result.user && !result.isNewUser) {
        await this.createOrUpdateAuthIdentity(
          result.user.id,
          'google',
          userProfile.sub,
          userProfile
        )
      }

      return result
    } catch (error) {
      console.error('Google authentication error:', error)
      return { success: false, error: 'Google authentication failed' }
    }
  }

  async authenticateWithGitHub(
    code: string,
    ipAddress: string,
    userAgent: string
  ): Promise<AuthResult> {
    if (!this.providers.github) {
      return { success: false, error: 'GitHub OAuth not configured' }
    }

    try {
      // Exchange authorization code for tokens
      const tokenData = await this.exchangeGitHubCode(code)
      if (!tokenData.access_token) {
        return { success: false, error: 'Failed to obtain access token' }
      }

      // Get user profile from GitHub
      const userProfile = await this.getGitHubUserProfile(tokenData.access_token)
      if (!userProfile.id) {
        return { success: false, error: 'Failed to obtain user profile' }
      }

      // Get user email (may require additional API call)
      const userEmail = userProfile.email || (await this.getGitHubUserEmail(tokenData.access_token))

      // Find or create user
      const result = await this.findOrCreateUserFromOAuth(
        'github',
        userProfile.id.toString(),
        userEmail || '',
        userProfile.login,
        userProfile.avatar_url,
        ipAddress,
        userAgent
      )

      if (!result.success) {
        return result
      }

      // Create auth identity if it doesn't exist
      if (result.user && !result.isNewUser) {
        await this.createOrUpdateAuthIdentity(
          result.user.id,
          'github',
          userProfile.id.toString(),
          userProfile
        )
      }

      return result
    } catch (error) {
      console.error('GitHub authentication error:', error)
      return { success: false, error: 'GitHub authentication failed' }
    }
  }

  async authenticateWithOAuth2(
    provider: string,
    code: string,
    ipAddress: string,
    userAgent: string
  ): Promise<AuthResult> {
    if (!this.providers.oauth2) {
      return { success: false, error: 'OAuth2 not configured' }
    }

    try {
      // Exchange authorization code for tokens
      const tokenData = await this.exchangeOAuth2Code(provider, code)
      if (!tokenData.access_token) {
        return { success: false, error: 'Failed to obtain access token' }
      }

      // Get user info from OAuth2 provider
      const userInfo = await this.getOAuth2UserInfo(provider, tokenData.access_token)
      if (!userInfo.sub) {
        return { success: false, error: 'Failed to obtain user info' }
      }

      // Find or create user
      const result = await this.findOrCreateUserFromOAuth(
        'oauth2',
        userInfo.sub,
        userInfo.email || '',
        userInfo.name || '',
        userInfo.picture || '',
        ipAddress,
        userAgent
      )

      if (!result.success) {
        return result
      }

      // Create auth identity if it doesn't exist
      if (result.user && !result.isNewUser) {
        await this.createOrUpdateAuthIdentity(result.user.id, 'oauth2', userInfo.sub, userInfo)
      }

      return result
    } catch (error) {
      console.error('OAuth2 authentication error:', error)
      return { success: false, error: 'OAuth2 authentication failed' }
    }
  }

  // Session management
  async createSession(userId?: string, ipAddress: string, userAgent: string): Promise<string> {
    const sessionId = crypto.randomUUID()
    const now = Math.floor(Date.now() / 1000)

    const sessionData: SessionData = {
      sessionId,
      userId,
      ipAddress,
      userAgent,
      createdAt: now,
      lastAccessAt: now,
    }

    // Store session using enhanced caching if available
    if (this.cacheService && this.enableAdvancedCaching) {
      await this.cacheService.set(`session:${sessionId}`, sessionData, {
        namespace: 'sessions',
        ttl: this.sessionTimeoutMinutes * 60,
        tags: ['session', userId ? `user:${userId}` : 'anonymous'],
        metadata: { ipAddress, userAgent, createdAt: now },
      })
    } else {
      // Fallback to direct KV storage
      await this.kv.put(`session:${sessionId}`, JSON.stringify(sessionData), {
        expirationTtl: this.sessionTimeoutMinutes * 60,
      })
    }

    return sessionId
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      let session: SessionData | null = null

      // Try enhanced cache first
      if (this.cacheService && this.enableAdvancedCaching) {
        session = await this.cacheService.get(`session:${sessionId}`, {
          namespace: 'sessions',
        })
      } else {
        // Fallback to direct KV storage
        const sessionData = await this.kv.get(`session:${sessionId}`)
        if (sessionData) {
          session = JSON.parse(sessionData) as SessionData
        }
      }

      if (!session) {
        return null
      }

      // Check if session is expired
      const now = Math.floor(Date.now() / 1000)
      if (now - session.lastAccessAt > this.sessionTimeoutMinutes * 60) {
        await this.deleteSession(sessionId)
        return null
      }

      // Update last access time
      session.lastAccessAt = now

      if (this.cacheService && this.enableAdvancedCaching) {
        await this.cacheService.set(`session:${sessionId}`, session, {
          namespace: 'sessions',
          ttl: this.sessionTimeoutMinutes * 60,
        })
      } else {
        // Fallback to direct KV storage
        await this.kv.put(`session:${sessionId}`, JSON.stringify(session), {
          expirationTtl: this.sessionTimeoutMinutes * 60,
        })
      }

      return session
    } catch (error) {
      console.error('Failed to get session:', error)
      return null
    }
  }

  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId)
      if (!session) {
        return false
      }

      const updatedSession = { ...session, ...updates }

      if (this.cacheService && this.enableAdvancedCaching) {
        await this.cacheService.set(`session:${sessionId}`, updatedSession, {
          namespace: 'sessions',
          ttl: this.sessionTimeoutMinutes * 60,
        })
      } else {
        // Fallback to direct KV storage
        await this.kv.put(`session:${sessionId}`, JSON.stringify(updatedSession), {
          expirationTtl: this.sessionTimeoutMinutes * 60,
        })
      }

      return true
    } catch (error) {
      console.error('Failed to update session:', error)
      return false
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      if (this.cacheService && this.enableAdvancedCaching) {
        await this.cacheService.delete(`session:${sessionId}`, {
          namespace: 'sessions',
        })
      } else {
        // Fallback to direct KV storage
        await this.kv.delete(`session:${sessionId}`)
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  // Token management
  generateToken(sessionId: string, userId?: string, tier?: string): string {
    const now = Math.floor(Date.now() / 1000)
    const payload: TokenPayload = {
      sessionId,
      userId,
      ipAddress: '', // Will be set during verification
      tier,
      exp: now + 24 * 60 * 60, // 24 hours
      iat: now,
    }

    // Simple JWT-like token implementation (in production, use proper JWT library)
    const header = { alg: 'HS256', typ: 'JWT' }
    const encodedHeader = btoa(JSON.stringify(header))
    const encodedPayload = btoa(JSON.stringify(payload))
    const signature = this.sign(`${encodedHeader}.${encodedPayload}`)

    return `${encodedHeader}.${encodedPayload}.${signature}`
  }

  async verifyToken(token: string, ipAddress: string): Promise<TokenPayload | null> {
    try {
      const [header, payload, signature] = token.split('.')
      if (!header || !payload || !signature) {
        return null
      }

      // Verify signature
      const expectedSignature = this.sign(`${header}.${payload}`)
      if (signature !== expectedSignature) {
        return null
      }

      const decodedPayload = JSON.parse(atob(payload)) as TokenPayload

      // Check expiration
      const now = Math.floor(Date.now() / 1000)
      if (decodedPayload.exp < now) {
        return null
      }

      // Verify session exists
      const session = await this.getSession(decodedPayload.sessionId)
      if (!session) {
        return null
      }

      // Update IP address and tier
      decodedPayload.ipAddress = ipAddress
      if (session.userId) {
        const user = await this.getUserById(session.userId)
        if (user) {
          decodedPayload.tier = user.subscription_tier
        }
      }

      return decodedPayload
    } catch (error) {
      console.error('Failed to verify token:', error)
      return null
    }
  }

  // Private helper methods
  private async exchangeGoogleCode(code: string): Promise<any> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.providers.google?.clientId,
        client_secret: this.providers.google?.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.providers.google?.redirectUri,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to exchange Google code')
    }

    return response.json()
  }

  private async getGoogleUserProfile(accessToken: string): Promise<GoogleProviderData> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get Google user profile')
    }

    return response.json()
  }

  private async exchangeGitHubCode(code: string): Promise<any> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.providers.github?.clientId,
        client_secret: this.providers.github?.clientSecret,
        code,
        redirect_uri: this.providers.github?.redirectUri,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to exchange GitHub code')
    }

    return response.json()
  }

  private async getGitHubUserProfile(accessToken: string): Promise<GitHubProviderData> {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'Parsify-Dev',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get GitHub user profile')
    }

    return response.json()
  }

  private async getGitHubUserEmail(accessToken: string): Promise<string | null> {
    const response = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'Parsify-Dev',
      },
    })

    if (!response.ok) {
      return null
    }

    const emails = await response.json()
    const primaryEmail = emails.find((email: any) => email.primary && email.verified)
    return primaryEmail?.email || null
  }

  private async exchangeOAuth2Code(provider: string, code: string): Promise<any> {
    // Generic OAuth2 implementation - customize based on provider
    const config = this.providers.oauth2!

    const response = await fetch(`${provider}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to exchange OAuth2 code')
    }

    return response.json()
  }

  private async getOAuth2UserInfo(
    provider: string,
    accessToken: string
  ): Promise<OAuth2ProviderData> {
    const response = await fetch(`${provider}/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get OAuth2 user info')
    }

    const userInfo = await response.json()
    return {
      ...userInfo,
      provider,
    }
  }

  private async findOrCreateUserFromOAuth(
    provider: string,
    providerUid: string,
    email: string,
    name: string,
    avatarUrl: string,
    ipAddress: string,
    userAgent: string
  ): Promise<AuthResult> {
    try {
      // Check if auth identity already exists
      const existingAuthIdentity = await this.getAuthIdentity(provider, providerUid)
      if (existingAuthIdentity) {
        const user = await this.getUserById(existingAuthIdentity.user_id)
        if (user) {
          // Create session for existing user
          const sessionId = await this.createSession(user.id, ipAddress, userAgent)
          return { success: true, user, sessionId, isNewUser: false }
        }
      }

      // Check if user exists by email
      let user: User | null = null
      if (email) {
        user = await this.getUserByEmail(email)
      }

      let isNewUser = false

      if (!user) {
        // Create new user using enhanced transaction
        user = await this.client.enhancedTransaction(
          async tx => {
            const userData = {
              email,
              name,
              avatar_url: avatarUrl,
            }
            const newUser = User.create(userData)

            // Insert user
            await tx.execute(USER_QUERIES.INSERT, [
              newUser.id,
              newUser.email,
              newUser.name,
              newUser.avatar_url,
              newUser.subscription_tier,
              newUser.preferences ? JSON.stringify(newUser.preferences) : null,
              newUser.created_at,
              newUser.updated_at,
              newUser.last_login_at,
            ])

            // Log audit event
            if (this.auditEnabled) {
              const auditLog = AuditLog.create({
                user_id: newUser.id,
                action: 'oauth_register' as any,
                resource_type: 'user' as any,
                resource_id: newUser.id,
                new_values: {
                  email: newUser.email,
                  name: newUser.name,
                  provider,
                },
                ip_address: ipAddress,
                user_agent: userAgent,
                success: true,
              })

              await tx.execute(AUDIT_LOG_QUERIES.INSERT, [
                auditLog.id,
                auditLog.user_id,
                auditLog.action,
                auditLog.resource_type,
                auditLog.resource_id,
                auditLog.new_values ? JSON.stringify(auditLog.new_values) : null,
                auditLog.ip_address,
                auditLog.user_agent,
                auditLog.success,
                auditLog.error_message,
                auditLog.created_at,
              ])
            }

            return newUser
          },
          {
            isolationLevel: IsolationLevel.READ_COMMITTED,
            timeout: 15000,
            enableMetrics: true,
            enableLogging: true,
          }
        )

        isNewUser = true
      }

      // Create auth identity using enhanced transaction
      await this.client.enhancedTransaction(
        async tx => {
          const authIdentity = AuthIdentity.create({
            user_id: user.id,
            provider: provider as any,
            provider_uid: providerUid,
            provider_data: {
              sub: providerUid,
              email,
              name,
              picture: avatarUrl,
              email_verified: true,
              provider,
            },
          })

          await tx.execute(AUTH_IDENTITY_QUERIES.INSERT, [
            authIdentity.id,
            authIdentity.user_id,
            authIdentity.provider,
            authIdentity.provider_uid,
            authIdentity.provider_data ? JSON.stringify(authIdentity.provider_data) : null,
            authIdentity.created_at,
          ])

          // Log audit event
          if (this.auditEnabled) {
            const auditLog = AuditLog.create({
              user_id: user.id,
              action: 'auth_identity_created' as any,
              resource_type: 'auth_identity' as any,
              resource_id: authIdentity.id,
              new_values: { provider, provider_uid: providerUid },
              ip_address: ipAddress,
              user_agent: userAgent,
              success: true,
            })

            await tx.execute(AUDIT_LOG_QUERIES.INSERT, [
              auditLog.id,
              auditLog.user_id,
              auditLog.action,
              auditLog.resource_type,
              auditLog.resource_id,
              auditLog.new_values ? JSON.stringify(auditLog.new_values) : null,
              auditLog.ip_address,
              auditLog.user_agent,
              auditLog.success,
              auditLog.error_message,
              auditLog.created_at,
            ])
          }

          return authIdentity
        },
        {
          isolationLevel: IsolationLevel.READ_COMMITTED,
          timeout: 10000,
          enableMetrics: true,
          enableLogging: true,
        }
      )

      // Create session
      const sessionId = await this.createSession(user.id, ipAddress, userAgent)

      return { success: true, user, sessionId, isNewUser }
    } catch (error) {
      console.error('Failed to find or create user:', error)
      return { success: false, error: 'User creation failed' }
    }
  }

  private async getUserById(userId: string): Promise<User | null> {
    // Try cache first
    if (this.cacheService && this.enableAdvancedCaching) {
      return this.cacheService.getOrSet(
        `user:${userId}`,
        async () => {
          const result = await this.client.queryFirst(USER_QUERIES.SELECT_BY_ID, [userId])
          return result ? User.fromRow(result) : null
        },
        {
          namespace: 'cache',
          ttl: 3600,
          tags: ['user'],
          staleWhileRevalidate: true,
        }
      )
    }

    // Fallback to database
    const result = await this.client.queryFirst(USER_QUERIES.SELECT_BY_ID, [userId])
    return result ? User.fromRow(result) : null
  }

  private async getUserByEmail(email: string): Promise<User | null> {
    // Try cache first
    if (this.cacheService && this.enableAdvancedCaching) {
      return this.cacheService.getOrSet(
        `user_by_email:${email}`,
        async () => {
          const result = await this.client.queryFirst(USER_QUERIES.SELECT_BY_EMAIL, [email])
          return result ? User.fromRow(result) : null
        },
        {
          namespace: 'cache',
          ttl: 3600,
          tags: ['user', 'email_lookup'],
          staleWhileRevalidate: true,
        }
      )
    }

    // Fallback to database
    const result = await this.client.queryFirst(USER_QUERIES.SELECT_BY_EMAIL, [email])
    return result ? User.fromRow(result) : null
  }

  private async getAuthIdentity(
    provider: string,
    providerUid: string
  ): Promise<AuthIdentity | null> {
    const stmt = this.db.prepare(AUTH_IDENTITY_QUERIES.SELECT_BY_PROVIDER_AND_UID)
    const result = await stmt.bind(provider, providerUid).first()
    return result ? AuthIdentity.fromRow(result) : null
  }

  private async createAuthIdentity(
    userId: string,
    provider: string,
    providerUid: string,
    providerData: any
  ): Promise<AuthIdentity> {
    const authIdentity = AuthIdentity.create({
      user_id: userId,
      provider: provider as any,
      provider_uid: providerUid,
      provider_data: providerData,
    })

    await this.client.execute(AUTH_IDENTITY_QUERIES.INSERT, [
      authIdentity.id,
      authIdentity.user_id,
      authIdentity.provider,
      authIdentity.provider_uid,
      authIdentity.provider_data ? JSON.stringify(authIdentity.provider_data) : null,
      authIdentity.created_at,
    ])

    return authIdentity
  }

  private async createOrUpdateAuthIdentity(
    userId: string,
    provider: string,
    providerUid: string,
    providerData: any
  ): Promise<AuthIdentity> {
    const existing = await this.getAuthIdentity(provider, providerUid)

    if (existing) {
      // Update existing identity
      await this.client.execute(AUTH_IDENTITY_QUERIES.UPDATE, [
        JSON.stringify(providerData),
        existing.id,
      ])

      return existing
    } else {
      // Create new identity
      return this.createAuthIdentity(userId, provider, providerUid, providerData)
    }
  }

  private sign(data: string): string {
    // Simple HMAC-SHA256 implementation (in production, use proper crypto library)
    const encoder = new TextEncoder()
    const keyData = encoder.encode(this.jwtSecret)
    const messageData = encoder.encode(data)

    return crypto.subtle
      .importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      .then(key => crypto.subtle.sign('HMAC', key, messageData))
      .then(signature => btoa(String.fromCharCode(...new Uint8Array(signature))))
      .then(encoded => encoded) as any
  }

  // Rate limiting for authentication
  async checkAuthRateLimit(ipAddress: string): Promise<boolean> {
    try {
      const key = `auth_rate_limit:${ipAddress}`

      if (this.cacheService && this.enableAdvancedCaching) {
        const count = await this.cacheService.get<number>(key, {
          namespace: 'sessions',
        })
        const currentCount = count || 0

        if (currentCount >= 10) {
          return false
        }

        await this.cacheService.set(key, currentCount + 1, {
          namespace: 'sessions',
          ttl: 3600,
        })
      } else {
        // Fallback to direct KV
        const count = await this.kv.get(key)
        const currentCount = parseInt(count || '0', 10)

        if (currentCount >= 10) {
          return false
        }

        await this.kv.put(key, (currentCount + 1).toString(), {
          expirationTtl: 3600,
        })
      }

      return true
    } catch (error) {
      console.error('Failed to check auth rate limit:', error)
      return true // Fail open
    }
  }

  // Cache management methods
  async invalidateUserCache(userId: string): Promise<void> {
    if (!this.cacheService || !this.enableAdvancedCaching) {
      return
    }

    try {
      // Get user to find related cache keys
      const user = await this.getUserById(userId)
      if (!user) {
        return
      }

      // Invalidate user-specific cache entries
      await this.cacheService.invalidate({
        namespace: 'cache',
        tags: [`user:${userId}`, `user_tier:${user.subscription_tier}`],
      })

      // Invalidate email lookup
      if (user.email) {
        await this.cacheService.delete(`user_by_email:${user.email}`, {
          namespace: 'cache',
        })
      }

      // Invalidate user sessions
      await this.cacheService.invalidate({
        namespace: 'sessions',
        tags: [`user:${userId}`],
      })
    } catch (error) {
      console.error('Failed to invalidate user cache:', error)
    }
  }

  async warmupUserCache(userId: string): Promise<void> {
    if (!this.cacheService || !this.enableAdvancedCaching) {
      return
    }

    try {
      // Preload frequently accessed user data
      const user = await this.getUserById(userId)
      if (!user) {
        return
      }

      // Cache user data
      await this.cacheService.set(`user:${userId}`, user, {
        namespace: 'cache',
        ttl: 3600,
        tags: ['user', `user_tier:${user.subscription_tier}`],
      })

      // Cache email lookup
      if (user.email) {
        await this.cacheService.set(`user_by_email:${user.email}`, user, {
          namespace: 'cache',
          ttl: 3600,
          tags: ['user', 'email_lookup'],
        })
      }
    } catch (error) {
      console.error('Failed to warmup user cache:', error)
    }
  }

  // Cache analytics
  getCacheMetrics() {
    if (!this.cacheService) {
      return null
    }
    return this.cacheService.getMetrics()
  }

  async getCacheAnalytics() {
    if (!this.cacheService) {
      return null
    }
    return this.cacheService.getAnalytics()
  }
}
