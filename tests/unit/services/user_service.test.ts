import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UserService } from '@/api/src/services/user_service'
import {
  cleanupTestEnvironment,
  createMockAuditLog,
  createMockAuthIdentity,
  createMockFileUpload,
  createMockToolUsage,
  createMockUser,
  createTestDatabase,
  type MockD1Database,
  setupTestEnvironment,
} from '../models/database.mock'

// Mock the database client module
vi.mock('@/api/src/database', () => ({
  DatabaseClient: vi.fn(),
  createDatabaseClient: vi.fn(() => ({
    query: vi.fn(),
    queryFirst: vi.fn(),
    execute: vi.fn(),
    enhancedTransaction: vi.fn(),
  })),
  TransactionHelper: vi.fn(),
  IsolationLevel: {
    READ_COMMITTED: 'READ_COMMITTED',
  },
}))

// Mock the models
vi.mock('@/api/src/models/user', () => ({
  User: {
    create: vi.fn(),
    fromRow: vi.fn(),
  },
  UserSchema: {
    parse: vi.fn(),
    safeParse: vi.fn(),
  },
  CreateUserSchema: {
    parse: vi.fn(),
  },
  UpdateUserSchema: {
    parse: vi.fn(),
  },
  USER_QUERIES: {
    INSERT: 'INSERT INTO users...',
    SELECT_BY_ID: 'SELECT * FROM users WHERE id = ?',
    SELECT_BY_EMAIL: 'SELECT * FROM users WHERE email = ?',
    UPDATE: 'UPDATE users SET...',
    UPDATE_LAST_LOGIN: 'UPDATE users SET last_login_at = ?...',
    DELETE: 'DELETE FROM users WHERE id = ?',
    LIST: 'SELECT * FROM users WHERE subscription_tier >= ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    COUNT: 'SELECT COUNT(*) as count FROM users',
  },
}))

vi.mock('@/api/src/models/auth_identity', () => ({
  AuthIdentity: {
    create: vi.fn(),
    fromRow: vi.fn(),
  },
  AUTH_IDENTITY_QUERIES: {
    INSERT: 'INSERT INTO auth_identities...',
  },
}))

vi.mock('@/api/src/models/tool_usage', () => ({
  ToolUsage: {
    create: vi.fn(),
    fromRow: vi.fn(),
  },
  TOOL_USAGE_QUERIES: {
    COUNT_BY_USER: 'SELECT COUNT(*) as count FROM tool_usage WHERE user_id = ?',
  },
}))

vi.mock('@/api/src/models/file_upload', () => ({
  FileUpload: {
    create: vi.fn(),
    fromRow: vi.fn(),
  },
  FILE_UPLOAD_QUERIES: {
    COUNT_BY_USER: 'SELECT COUNT(*) as count FROM file_uploads WHERE user_id = ?',
    SUM_SIZE_BY_USER: 'SELECT SUM(size) as total_size_bytes FROM file_uploads WHERE user_id = ?',
  },
}))

vi.mock('@/api/src/models/audit_log', () => ({
  AuditLog: {
    create: vi.fn(),
    fromRow: vi.fn(),
  },
  AUDIT_LOG_QUERIES: {
    INSERT: 'INSERT INTO audit_logs...',
  },
}))

describe('UserService', () => {
  let userService: UserService
  let mockDb: MockD1Database
  let mockDbClient: any

  beforeEach(() => {
    setupTestEnvironment()

    mockDb = createTestDatabase({
      users: [createMockUser()],
      auth_identities: [createMockAuthIdentity()],
      tool_usage: [createMockToolUsage()],
      file_uploads: [createMockFileUpload()],
      audit_logs: [createMockAuditLog()],
    })

    // Create a mock database client
    mockDbClient = {
      query: vi.fn(),
      queryFirst: vi.fn(),
      execute: vi.fn(),
      enhancedTransaction: vi.fn(),
    }

    const { createDatabaseClient } = require('@/api/src/database')
    createDatabaseClient.mockReturnValue(mockDbClient)

    userService = new UserService({
      db: mockDb as any,
      auditEnabled: true,
    })
  })

  afterEach(() => {
    cleanupTestEnvironment()
    vi.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      const service = new UserService({ db: mockDb as any })
      expect(service).toBeDefined()
    })

    it('should initialize with custom options', () => {
      const service = new UserService({
        db: mockDb as any,
        auditEnabled: false,
        databaseConfig: {
          maxConnections: 10,
          connectionTimeoutMs: 5000,
          retryAttempts: 3,
          enableMetrics: true,
        },
      })
      expect(service).toBeDefined()
    })
  })

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        subscription_tier: 'free' as const,
      }

      const mockUser = createMockUser(userData)
      const { User, CreateUserSchema } = require('@/api/src/models/user')

      CreateUserSchema.parse.mockReturnValue(userData)
      User.create.mockReturnValue(mockUser)

      mockDbClient.enhancedTransaction.mockImplementation(async callback => {
        await callback(mockDbClient)
        return mockUser
      })

      const result = await userService.createUser(userData, '127.0.0.1', 'test-agent')

      expect(result).toEqual(mockUser)
      expect(CreateUserSchema.parse).toHaveBeenCalledWith(userData)
      expect(User.create).toHaveBeenCalledWith(userData)
      expect(mockDbClient.enhancedTransaction).toHaveBeenCalled()
    })

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        name: 'Existing User',
      }

      const { User } = require('@/api/src/models/user')
      const existingUser = createMockUser({ email: 'existing@example.com' })

      mockDbClient.queryFirst.mockResolvedValue(existingUser)
      User.fromRow.mockReturnValue(existingUser)

      await expect(userService.createUser(userData)).rejects.toThrow(
        'User with email existing@example.com already exists'
      )
    })

    it('should handle database errors gracefully', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      }

      mockDbClient.queryFirst.mockResolvedValue(null) // No existing user
      mockDbClient.enhancedTransaction.mockRejectedValue(new Error('Database error'))

      await expect(userService.createUser(userData)).rejects.toThrow(
        'Failed to create user: Error: Database error'
      )
    })
  })

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const userId = 'user-123'
      const mockUser = createMockUser({ id: userId })

      mockDbClient.queryFirst.mockResolvedValue(mockUser)
      const { User } = require('@/api/src/models/user')
      User.fromRow.mockReturnValue(mockUser)

      const result = await userService.getUserById(userId)

      expect(result).toEqual(mockUser)
      expect(mockDbClient.queryFirst).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?', [
        userId,
      ])
    })

    it('should return null when user not found', async () => {
      const userId = 'nonexistent-user'
      mockDbClient.queryFirst.mockResolvedValue(null)

      const result = await userService.getUserById(userId)

      expect(result).toBeNull()
    })

    it('should handle database errors', async () => {
      const userId = 'user-123'
      mockDbClient.queryFirst.mockRejectedValue(new Error('Database error'))

      await expect(userService.getUserById(userId)).rejects.toThrow(
        'Failed to get user: Error: Database error'
      )
    })
  })

  describe('getUserByEmail', () => {
    it('should return user when found', async () => {
      const email = 'test@example.com'
      const mockUser = createMockUser({ email })

      mockDbClient.queryFirst.mockResolvedValue(mockUser)
      const { User } = require('@/api/src/models/user')
      User.fromRow.mockReturnValue(mockUser)

      const result = await userService.getUserByEmail(email)

      expect(result).toEqual(mockUser)
      expect(mockDbClient.queryFirst).toHaveBeenCalledWith('SELECT * FROM users WHERE email = ?', [
        email,
      ])
    })

    it('should return null when user not found', async () => {
      const email = 'nonexistent@example.com'
      mockDbClient.queryFirst.mockResolvedValue(null)

      const result = await userService.getUserByEmail(email)

      expect(result).toBeNull()
    })
  })

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const userId = 'user-123'
      const updateData = {
        name: 'Updated Name',
        subscription_tier: 'pro' as const,
      }

      const existingUser = createMockUser({ id: userId })
      const updatedUser = createMockUser({
        id: userId,
        name: 'Updated Name',
        subscription_tier: 'pro',
      })

      mockDbClient.queryFirst.mockResolvedValue(existingUser)
      const { User, UpdateUserSchema } = require('@/api/src/models/user')
      User.fromRow.mockReturnValue(existingUser)
      UpdateUserSchema.parse.mockReturnValue(updateData)

      const mockUpdatedInstance = {
        ...existingUser,
        update: vi.fn().mockReturnValue(updatedUser),
      }
      User.fromRow.mockReturnValue(mockUpdatedInstance)

      mockDbClient.enhancedTransaction.mockImplementation(async callback => {
        await callback(mockDbClient)
        return updatedUser
      })

      const result = await userService.updateUser(userId, updateData, '127.0.0.1', 'test-agent')

      expect(result).toEqual(updatedUser)
      expect(UpdateUserSchema.parse).toHaveBeenCalledWith(updateData)
      expect(mockDbClient.enhancedTransaction).toHaveBeenCalled()
    })

    it('should throw error if user not found', async () => {
      const userId = 'nonexistent-user'
      const updateData = { name: 'Updated Name' }

      mockDbClient.queryFirst.mockResolvedValue(null)

      await expect(userService.updateUser(userId, updateData)).rejects.toThrow(
        `User with ID ${userId} not found`
      )
    })
  })

  describe('updateLastLogin', () => {
    it('should update last login successfully', async () => {
      const userId = 'user-123'
      const existingUser = createMockUser({ id: userId, last_login_at: null })
      const updatedUser = createMockUser({
        id: userId,
        last_login_at: Math.floor(Date.now() / 1000),
      })

      mockDbClient.queryFirst.mockResolvedValue(existingUser)
      const { User } = require('@/api/src/models/user')
      User.fromRow.mockReturnValue(existingUser)

      const mockUpdatedInstance = {
        ...existingUser,
        updateLastLogin: vi.fn().mockReturnValue(updatedUser),
      }
      User.fromRow.mockReturnValue(mockUpdatedInstance)

      mockDbClient.execute.mockResolvedValue({ success: true })

      const result = await userService.updateLastLogin(userId, '127.0.0.1', 'test-agent')

      expect(result).toEqual(updatedUser)
      expect(mockDbClient.execute).toHaveBeenCalled()
    })

    it('should throw error if user not found', async () => {
      const userId = 'nonexistent-user'
      mockDbClient.queryFirst.mockResolvedValue(null)

      await expect(userService.updateLastLogin(userId)).rejects.toThrow(
        `User with ID ${userId} not found`
      )
    })
  })

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const userId = 'user-123'
      const existingUser = createMockUser({ id: userId })

      mockDbClient.queryFirst.mockResolvedValue(existingUser)
      const { User } = require('@/api/src/models/user')
      User.fromRow.mockReturnValue(existingUser)

      mockDbClient.execute.mockResolvedValue({
        success: true,
        meta: { changes: 1 },
      })

      await userService.deleteUser(userId, '127.0.0.1', 'test-agent')

      expect(mockDbClient.execute).toHaveBeenCalledWith('DELETE FROM users WHERE id = ?', [userId])
    })

    it('should throw error if user not found', async () => {
      const userId = 'nonexistent-user'
      mockDbClient.queryFirst.mockResolvedValue(null)

      await expect(userService.deleteUser(userId)).rejects.toThrow(
        `User with ID ${userId} not found`
      )
    })
  })

  describe('listUsers', () => {
    it('should list users with default parameters', async () => {
      const mockUsers = [createMockUser(), createMockUser({ id: 'user-456' })]

      mockDbClient.query.mockResolvedValue(mockUsers)
      const { User } = require('@/api/src/models/user')
      User.fromRow.mockImplementation(row => row)

      const result = await userService.listUsers()

      expect(result).toHaveLength(2)
      expect(mockDbClient.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE subscription_tier >= ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        ['free', 50, 0]
      )
    })

    it('should list users with custom parameters', async () => {
      const mockUsers = [createMockUser({ subscription_tier: 'pro' })]

      mockDbClient.query.mockResolvedValue(mockUsers)
      const { User } = require('@/api/src/models/user')
      User.fromRow.mockImplementation(row => row)

      const result = await userService.listUsers('pro', 10, 5)

      expect(result).toHaveLength(1)
      expect(mockDbClient.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE subscription_tier >= ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        ['pro', 10, 5]
      )
    })
  })

  describe('searchUsers', () => {
    it('should search users by query', async () => {
      const query = 'test'
      const mockUsers = [createMockUser({ name: 'Test User' })]

      mockDbClient.query.mockResolvedValue(mockUsers)
      const { User } = require('@/api/src/models/user')
      User.fromRow.mockImplementation(row => row)

      const result = await userService.searchUsers(query)

      expect(result).toHaveLength(1)
      expect(mockDbClient.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE email LIKE ? OR name LIKE ?'),
        ['%test%', '%test%', 20]
      )
    })
  })

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const userId = 'user-123'
      const mockUser = createMockUser({ id: userId })

      mockDbClient.queryFirst
        .mockResolvedValueOnce({ count: 10 }) // tool usage
        .mockResolvedValueOnce({ count: 5 }) // file uploads
        .mockResolvedValueOnce({ total_size_bytes: 1024000 }) // storage
        .mockResolvedValueOnce(mockUser) // user details

      const { User } = require('@/api/src/models/user')
      User.fromRow.mockReturnValue(mockUser)

      const result = await userService.getUserStats(userId)

      expect(result).toEqual({
        total_api_requests: 10,
        total_files_uploaded: 5,
        total_storage_used: 1024000,
        last_login_at: mockUser.last_login_at,
        created_at: mockUser.created_at,
      })
    })

    it('should throw error if user not found', async () => {
      const userId = 'nonexistent-user'
      mockDbClient.queryFirst.mockResolvedValue({ count: 0 })

      await expect(userService.getUserStats(userId)).rejects.toThrow(
        `User with ID ${userId} not found`
      )
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email', async () => {
      const result = await userService.validateEmail('test@example.com')
      expect(result).toBe(true)
    })

    it('should reject invalid email', async () => {
      const result = await userService.validateEmail('invalid-email')
      expect(result).toBe(false)
    })
  })

  describe('isEmailAvailable', () => {
    it('should return true for available email', async () => {
      const email = 'available@example.com'
      mockDbClient.queryFirst.mockResolvedValue(null)

      const result = await userService.isEmailAvailable(email)

      expect(result).toBe(true)
    })

    it('should return false for taken email', async () => {
      const email = 'taken@example.com'
      const existingUser = createMockUser({ email })

      mockDbClient.queryFirst.mockResolvedValue(existingUser)
      const { User } = require('@/api/src/models/user')
      User.fromRow.mockReturnValue(existingUser)

      const result = await userService.isEmailAvailable(email)

      expect(result).toBe(false)
    })
  })

  describe('getUsersByIds', () => {
    it('should return users for valid IDs', async () => {
      const userIds = ['user-123', 'user-456']
      const mockUsers = [createMockUser({ id: 'user-123' }), createMockUser({ id: 'user-456' })]

      mockDbClient.query.mockResolvedValue(mockUsers)
      const { User } = require('@/api/src/models/user')
      User.fromRow.mockImplementation(row => row)

      const result = await userService.getUsersByIds(userIds)

      expect(result).toHaveLength(2)
      expect(mockDbClient.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id IN'),
        userIds
      )
    })

    it('should return empty array for empty IDs', async () => {
      const result = await userService.getUsersByIds([])
      expect(result).toHaveLength(0)
    })
  })

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      const userId = 'user-123'
      const preferences = { theme: 'dark', language: 'en' }
      const existingUser = createMockUser({
        id: userId,
        preferences: { theme: 'light' },
      })
      const updatedUser = createMockUser({
        id: userId,
        preferences: { theme: 'dark', language: 'en' },
      })

      mockDbClient.queryFirst.mockResolvedValue(existingUser)
      const { User } = require('@/api/src/models/user')
      User.fromRow.mockReturnValue(existingUser)

      mockDbClient.enhancedTransaction.mockImplementation(async callback => {
        await callback(mockDbClient)
        return updatedUser
      })

      const result = await userService.updatePreferences(userId, preferences)

      expect(result).toEqual(updatedUser)
    })

    it('should throw error if user not found', async () => {
      const userId = 'nonexistent-user'
      const preferences = { theme: 'dark' }
      mockDbClient.queryFirst.mockResolvedValue(null)

      await expect(userService.updatePreferences(userId, preferences)).rejects.toThrow(
        `User with ID ${userId} not found`
      )
    })
  })

  describe('upgradeSubscription', () => {
    it('should upgrade subscription successfully', async () => {
      const userId = 'user-123'
      const existingUser = createMockUser({
        id: userId,
        subscription_tier: 'free',
      })
      const updatedUser = createMockUser({
        id: userId,
        subscription_tier: 'pro',
      })

      mockDbClient.queryFirst.mockResolvedValue(existingUser)
      const { User } = require('@/api/src/models/user')
      User.fromRow.mockReturnValue(existingUser)

      mockDbClient.enhancedTransaction.mockImplementation(async callback => {
        await callback(mockDbClient)
        return updatedUser
      })

      const result = await userService.upgradeSubscription(userId, 'pro')

      expect(result).toEqual(updatedUser)
    })

    it('should return same user if already at tier', async () => {
      const userId = 'user-123'
      const existingUser = createMockUser({
        id: userId,
        subscription_tier: 'pro',
      })

      mockDbClient.queryFirst.mockResolvedValue(existingUser)
      const { User } = require('@/api/src/models/user')
      User.fromRow.mockReturnValue(existingUser)

      const result = await userService.upgradeSubscription(userId, 'pro')

      expect(result).toEqual(existingUser)
    })
  })

  describe('downgradeSubscription', () => {
    it('should downgrade subscription successfully', async () => {
      const userId = 'user-123'
      const existingUser = createMockUser({
        id: userId,
        subscription_tier: 'pro',
      })
      const updatedUser = createMockUser({
        id: userId,
        subscription_tier: 'free',
      })

      mockDbClient.queryFirst.mockResolvedValue(existingUser)
      const { User } = require('@/api/src/models/user')
      User.fromRow.mockReturnValue(existingUser)

      mockDbClient.enhancedTransaction.mockImplementation(async callback => {
        await callback(mockDbClient)
        return updatedUser
      })

      const result = await userService.downgradeSubscription(userId, 'free')

      expect(result).toEqual(updatedUser)
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const userId = 'user-123'
      mockDbClient.queryFirst.mockRejectedValue(new Error('Connection failed'))

      await expect(userService.getUserById(userId)).rejects.toThrow(
        'Failed to get user: Error: Connection failed'
      )
    })

    it('should handle malformed data from database', async () => {
      const userId = 'user-123'
      mockDbClient.queryFirst.mockResolvedValue({ invalid: 'data' })
      const { User } = require('@/api/src/models/user')
      User.fromRow.mockImplementation(() => {
        throw new Error('Invalid user data')
      })

      await expect(userService.getUserById(userId)).rejects.toThrow(
        'Failed to get user: Error: Invalid user data'
      )
    })
  })

  describe('Batch Operations', () => {
    it('should update multiple users', async () => {
      const userIds = ['user-123', 'user-456']
      const updates = { subscription_tier: 'pro' as const }

      const mockUser1 = createMockUser({
        id: 'user-123',
        subscription_tier: 'free',
      })
      const mockUser2 = createMockUser({
        id: 'user-456',
        subscription_tier: 'free',
      })
      const updatedUser1 = createMockUser({
        id: 'user-123',
        subscription_tier: 'pro',
      })
      const updatedUser2 = createMockUser({
        id: 'user-456',
        subscription_tier: 'pro',
      })

      mockDbClient.queryFirst.mockResolvedValueOnce(mockUser1).mockResolvedValueOnce(mockUser2)

      const { User } = require('@/api/src/models/user')
      User.fromRow.mockReturnValue(mockUser1).mockReturnValueOnce(mockUser2)

      mockDbClient.enhancedTransaction
        .mockImplementationOnce(async callback => {
          await callback(mockDbClient)
          return updatedUser1
        })
        .mockImplementationOnce(async callback => {
          await callback(mockDbClient)
          return updatedUser2
        })

      const result = await userService.updateMultipleUsers(userIds, updates)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual(updatedUser1)
      expect(result[1]).toEqual(updatedUser2)
    })

    it('should handle partial failures in batch operations', async () => {
      const userIds = ['user-123', 'user-456']
      const updates = { subscription_tier: 'pro' as const }

      const mockUser1 = createMockUser({
        id: 'user-123',
        subscription_tier: 'free',
      })
      const updatedUser1 = createMockUser({
        id: 'user-123',
        subscription_tier: 'pro',
      })

      mockDbClient.queryFirst.mockResolvedValueOnce(mockUser1).mockResolvedValueOnce(null) // Second user not found

      const { User } = require('@/api/src/models/user')
      User.fromRow.mockReturnValue(mockUser1)

      mockDbClient.enhancedTransaction.mockImplementation(async callback => {
        await callback(mockDbClient)
        return updatedUser1
      })

      const result = await userService.updateMultipleUsers(userIds, updates)

      expect(result).toHaveLength(1) // Only successful update
      expect(result[0]).toEqual(updatedUser1)
    })
  })
})
