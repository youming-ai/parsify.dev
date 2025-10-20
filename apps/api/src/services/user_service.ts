import {
  User,
  UserSchema,
  CreateUserSchema,
  UpdateUserSchema,
  USER_QUERIES,
} from '../models/user'
import { AuthIdentity, AUTH_IDENTITY_QUERIES } from '../models/auth_identity'
import { ToolUsage, TOOL_USAGE_QUERIES } from '../models/tool_usage'
import { FileUpload, FILE_UPLOAD_QUERIES } from '../models/file_upload'
import { AuditLog, AUDIT_LOG_QUERIES } from '../models/audit_log'
import {
  DatabaseClient,
  createDatabaseClient,
  TransactionHelper,
  TransactionTemplates,
  IsolationLevel,
} from '../database'

export interface UserServiceOptions {
  db: D1Database
  auditEnabled?: boolean
  databaseConfig?: {
    maxConnections?: number
    connectionTimeoutMs?: number
    retryAttempts?: number
    enableMetrics?: boolean
  }
}

export interface CreateUserOptions {
  email: string
  name?: string
  avatar_url?: string
  subscription_tier?: 'free' | 'pro' | 'enterprise'
  preferences?: Record<string, any>
}

export interface UpdateUserOptions {
  name?: string
  avatar_url?: string
  subscription_tier?: 'free' | 'pro' | 'enterprise'
  preferences?: Record<string, any>
}

export interface UserStats {
  total_api_requests: number
  total_files_uploaded: number
  total_storage_used: number
  last_login_at?: number
  created_at: number
}

export class UserService {
  private db: D1Database
  private client: DatabaseClient
  private auditEnabled: boolean

  constructor(options: UserServiceOptions) {
    this.db = options.db
    this.client = createDatabaseClient(this.db, options.databaseConfig)
    this.auditEnabled = options.auditEnabled ?? true
  }

  // CRUD operations
  async createUser(
    options: CreateUserOptions,
    ipAddress?: string,
    userAgent?: string
  ): Promise<User> {
    const validatedData = CreateUserSchema.parse({
      email: options.email,
      name: options.name || null,
      avatar_url: options.avatar_url || null,
      subscription_tier: options.subscription_tier || 'free',
      preferences: options.preferences || null,
    })

    // Check if user already exists
    const existingUser = await this.getUserByEmail(validatedData.email)
    if (existingUser) {
      throw new Error(`User with email ${validatedData.email} already exists`)
    }

    const user = User.create(validatedData)

    try {
      // Use enhanced transaction for user creation
      return await this.client.enhancedTransaction(
        async tx => {
          // Insert user into database
          await tx.execute(USER_QUERIES.INSERT, [
            user.id,
            user.email,
            user.name,
            user.avatar_url,
            user.subscription_tier,
            user.preferences ? JSON.stringify(user.preferences) : null,
            user.created_at,
            user.updated_at,
            user.last_login_at,
          ])

          // Log audit event if enabled
          if (this.auditEnabled) {
            await this.logAuditTransaction(tx, {
              action: 'register',
              resource_type: 'user',
              resource_id: user.id,
              new_values: { email: user.email, name: user.name },
              ipAddress,
              userAgent,
            })
          }

          return user
        },
        {
          isolationLevel: IsolationLevel.READ_COMMITTED,
          timeout: 10000,
          enableMetrics: true,
          enableLogging: true,
        }
      )
    } catch (error) {
      throw new Error(`Failed to create user: ${error}`)
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const result = await this.client.queryFirst(USER_QUERIES.SELECT_BY_ID, [
        userId,
      ])

      if (!result) {
        return null
      }

      return User.fromRow(result)
    } catch (error) {
      throw new Error(`Failed to get user: ${error}`)
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.client.queryFirst(
        USER_QUERIES.SELECT_BY_EMAIL,
        [email]
      )

      if (!result) {
        return null
      }

      return User.fromRow(result)
    } catch (error) {
      throw new Error(`Failed to get user by email: ${error}`)
    }
  }

  async updateUser(
    userId: string,
    options: UpdateUserOptions,
    ipAddress?: string,
    userAgent?: string
  ): Promise<User> {
    const existingUser = await this.getUserById(userId)
    if (!existingUser) {
      throw new Error(`User with ID ${userId} not found`)
    }

    const validatedData = UpdateUserSchema.parse(options)
    const updatedUser = existingUser.update(validatedData)
    const isSignificant = this.isSignificantChange(existingUser, updatedUser)

    try {
      return await this.client.enhancedTransaction(
        async tx => {
          // Update user in database
          await tx.execute(USER_QUERIES.UPDATE, [
            updatedUser.name,
            updatedUser.avatar_url,
            updatedUser.subscription_tier,
            updatedUser.preferences
              ? JSON.stringify(updatedUser.preferences)
              : null,
            updatedUser.updated_at,
            updatedUser.last_login_at,
            updatedUser.id,
          ])

          // Log audit event for significant changes
          if (this.auditEnabled && isSignificant) {
            await this.logAuditTransaction(tx, {
              action: 'admin_action',
              resource_type: 'user',
              resource_id: userId,
              old_values: {
                name: existingUser.name,
                subscription_tier: existingUser.subscription_tier,
              },
              new_values: {
                name: updatedUser.name,
                subscription_tier: updatedUser.subscription_tier,
              },
              ipAddress,
              userAgent,
            })
          }

          return updatedUser
        },
        {
          isolationLevel: IsolationLevel.READ_COMMITTED,
          timeout: 10000,
          enableMetrics: true,
          enableLogging: true,
        }
      )
    } catch (error) {
      throw new Error(`Failed to update user: ${error}`)
    }
  }

  async updateLastLogin(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<User> {
    const existingUser = await this.getUserById(userId)
    if (!existingUser) {
      throw new Error(`User with ID ${userId} not found`)
    }

    const updatedUser = existingUser.updateLastLogin()

    try {
      await this.client.execute(USER_QUERIES.UPDATE_LAST_LOGIN, [
        updatedUser.last_login_at,
        updatedUser.updated_at,
        updatedUser.id,
      ])

      // Log login event
      if (this.auditEnabled) {
        await this.logAudit({
          action: 'login',
          resource_type: 'user',
          resource_id: userId,
          new_values: { last_login_at: updatedUser.last_login_at },
          ipAddress,
          userAgent,
        })
      }

      return updatedUser
    } catch (error) {
      throw new Error(`Failed to update last login: ${error}`)
    }
  }

  async deleteUser(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const existingUser = await this.getUserById(userId)
    if (!existingUser) {
      throw new Error(`User with ID ${userId} not found`)
    }

    try {
      // This will cascade delete related records due to foreign key constraints
      await this.client.execute(USER_QUERIES.DELETE, [userId])

      // Log audit event
      if (this.auditEnabled) {
        await this.logAudit({
          action: 'data_delete',
          resource_type: 'user',
          resource_id: userId,
          old_values: { email: existingUser.email, name: existingUser.name },
          ipAddress,
          userAgent,
        })
      }
    } catch (error) {
      throw new Error(`Failed to delete user: ${error}`)
    }
  }

  // List and search operations
  async listUsers(
    subscriptionTier?: 'free' | 'pro' | 'enterprise',
    limit = 50,
    offset = 0
  ): Promise<User[]> {
    try {
      const results = await this.client.query(USER_QUERIES.LIST, [
        subscriptionTier || 'free',
        limit,
        offset,
      ])

      return results.map(row => User.fromRow(row))
    } catch (error) {
      throw new Error(`Failed to list users: ${error}`)
    }
  }

  async searchUsers(query: string, limit = 20): Promise<User[]> {
    try {
      const searchQuery = `%${query}%`
      const results = await this.client.query(
        `
        SELECT * FROM users
        WHERE email LIKE ? OR name LIKE ?
        ORDER BY created_at DESC
        LIMIT ?
      `,
        [searchQuery, searchQuery, limit]
      )

      return results.map(row => User.fromRow(row))
    } catch (error) {
      throw new Error(`Failed to search users: ${error}`)
    }
  }

  // User statistics and analytics
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      // Get tool usage stats
      const toolUsageResult = await this.client.queryFirst(
        TOOL_USAGE_QUERIES.COUNT_BY_USER,
        [userId]
      )
      const totalApiRequests = (toolUsageResult?.count as number) || 0

      // Get file upload stats
      const fileUploadResult = await this.client.queryFirst(
        FILE_UPLOAD_QUERIES.COUNT_BY_USER,
        [userId]
      )
      const totalFilesUploaded = (fileUploadResult?.count as number) || 0

      // Get storage usage
      const storageResult = await this.client.queryFirst(
        FILE_UPLOAD_QUERIES.SUM_SIZE_BY_USER,
        [userId]
      )
      const totalStorageUsed = (storageResult?.total_size_bytes as number) || 0

      // Get user details
      const user = await this.getUserById(userId)
      if (!user) {
        throw new Error(`User with ID ${userId} not found`)
      }

      return {
        total_api_requests: totalApiRequests,
        total_files_uploaded: totalFilesUploaded,
        total_storage_used: totalStorageUsed,
        last_login_at: user.last_login_at || undefined,
        created_at: user.created_at,
      }
    } catch (error) {
      throw new Error(`Failed to get user stats: ${error}`)
    }
  }

  async getActiveUserCount(): Promise<number> {
    try {
      const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60
      const result = await this.client.queryFirst(
        `
        SELECT COUNT(*) as count FROM users
        WHERE last_login_at >= ?
      `,
        [thirtyDaysAgo]
      )
      return (result?.count as number) || 0
    } catch (error) {
      throw new Error(`Failed to get active user count: ${error}`)
    }
  }

  async getUserCountByTier(): Promise<Record<string, number>> {
    try {
      const result = await this.client.queryFirst(USER_QUERIES.COUNT)
      const totalUsers = (result?.count as number) || 0

      // Get counts by tier - simplified for now
      const freeResult = await this.client.queryFirst(USER_QUERIES.COUNT)

      return {
        free: (freeResult?.count as number) || 0,
        pro: 0, // TODO: Implement tier-specific counting
        enterprise: 0,
        total: totalUsers,
      }
    } catch (error) {
      throw new Error(`Failed to get user count by tier: ${error}`)
    }
  }

  // User preferences management
  async updatePreferences(
    userId: string,
    preferences: Record<string, any>
  ): Promise<User> {
    const user = await this.getUserById(userId)
    if (!user) {
      throw new Error(`User with ID ${userId} not found`)
    }

    const mergedPreferences = { ...user.preferences, ...preferences }
    return this.updateUser(userId, { preferences: mergedPreferences })
  }

  async getPreferences(userId: string): Promise<Record<string, any> | null> {
    const user = await this.getUserById(userId)
    return user?.preferences || null
  }

  // Subscription management
  async upgradeSubscription(
    userId: string,
    newTier: 'pro' | 'enterprise'
  ): Promise<User> {
    const user = await this.getUserById(userId)
    if (!user) {
      throw new Error(`User with ID ${userId} not found`)
    }

    if (user.subscription_tier === newTier) {
      return user // Already at this tier
    }

    return this.updateUser(userId, { subscription_tier: newTier })
  }

  async downgradeSubscription(
    userId: string,
    newTier: 'free' | 'pro'
  ): Promise<User> {
    const user = await this.getUserById(userId)
    if (!user) {
      throw new Error(`User with ID ${userId} not found`)
    }

    if (user.subscription_tier === newTier) {
      return user // Already at this tier
    }

    return this.updateUser(userId, { subscription_tier: newTier })
  }

  // Helper methods
  private isSignificantChange(oldUser: User, newUser: User): boolean {
    return (
      oldUser.name !== newUser.name ||
      oldUser.subscription_tier !== newUser.subscription_tier ||
      oldUser.avatar_url !== newUser.avatar_url
    )
  }

  private async logAudit(options: {
    action: string
    resource_type: string
    resource_id: string
    old_values?: Record<string, any>
    new_values?: Record<string, any>
    ipAddress?: string
    userAgent?: string
  }): Promise<void> {
    if (!this.auditEnabled) return

    try {
      const auditLog = AuditLog.create({
        user_id: options.resource_id, // User is both the actor and the resource
        action: options.action as any,
        resource_type: options.resource_type as any,
        resource_id: options.resource_id,
        old_values: options.old_values || null,
        new_values: options.new_values || null,
        ip_address: options.ipAddress || null,
        user_agent: options.userAgent || null,
        success: true,
      })

      await this.client.execute(AUDIT_LOG_QUERIES.INSERT, [
        auditLog.id,
        auditLog.user_id,
        auditLog.action,
        auditLog.resource_type,
        auditLog.resource_id,
        auditLog.old_values ? JSON.stringify(auditLog.old_values) : null,
        auditLog.new_values ? JSON.stringify(auditLog.new_values) : null,
        auditLog.ip_address,
        auditLog.user_agent,
        auditLog.success,
        auditLog.error_message,
        auditLog.created_at,
      ])
    } catch (error) {
      console.error('Failed to log audit event:', error)
    }
  }

  private async logAuditTransaction(
    tx: any,
    options: {
      action: string
      resource_type: string
      resource_id: string
      old_values?: Record<string, any>
      new_values?: Record<string, any>
      ipAddress?: string
      userAgent?: string
    }
  ): Promise<void> {
    if (!this.auditEnabled) return

    try {
      const auditLog = AuditLog.create({
        user_id: options.resource_id, // User is both the actor and the resource
        action: options.action as any,
        resource_type: options.resource_type as any,
        resource_id: options.resource_id,
        old_values: options.old_values || null,
        new_values: options.new_values || null,
        ip_address: options.ipAddress || null,
        user_agent: options.userAgent || null,
        success: true,
      })

      await tx.execute(AUDIT_LOG_QUERIES.INSERT, [
        auditLog.id,
        auditLog.user_id,
        auditLog.action,
        auditLog.resource_type,
        auditLog.resource_id,
        auditLog.old_values ? JSON.stringify(auditLog.old_values) : null,
        auditLog.new_values ? JSON.stringify(auditLog.new_values) : null,
        auditLog.ip_address,
        auditLog.user_agent,
        auditLog.success,
        auditLog.error_message,
        auditLog.created_at,
      ])
    } catch (error) {
      console.error('Failed to log audit event within transaction:', error)
    }
  }

  // Validation methods
  async validateEmail(email: string): Promise<boolean> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  async isEmailAvailable(email: string): Promise<boolean> {
    const existingUser = await this.getUserByEmail(email)
    return existingUser === null
  }

  // Batch operations
  async getUsersByIds(userIds: string[]): Promise<User[]> {
    if (userIds.length === 0) return []

    try {
      const placeholders = userIds.map(() => '?').join(',')
      const results = await this.client.query(
        `
        SELECT * FROM users WHERE id IN (${placeholders})
      `,
        userIds
      )

      return results.map(row => User.fromRow(row))
    } catch (error) {
      throw new Error(`Failed to get users by IDs: ${error}`)
    }
  }

  async updateMultipleUsers(
    userIds: string[],
    updates: UpdateUserOptions
  ): Promise<User[]> {
    const updatedUsers: User[] = []

    for (const userId of userIds) {
      try {
        const updatedUser = await this.updateUser(userId, updates)
        updatedUsers.push(updatedUser)
      } catch (error) {
        console.error(`Failed to update user ${userId}:`, error)
      }
    }

    return updatedUsers
  }
}
