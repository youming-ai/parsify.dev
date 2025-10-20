import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  User,
  UserSchema,
  CreateUserSchema,
  UpdateUserSchema,
  UserPreferencesSchema,
  USER_QUERIES,
} from '@/api/src/models'
import {
  createTestDatabase,
  createMockUser,
  setupTestEnvironment,
  cleanupTestEnvironment,
} from './database.mock'

describe('User Model', () => {
  let mockDb: any

  beforeEach(() => {
    setupTestEnvironment()
    mockDb = createTestDatabase()
  })

  afterEach(() => {
    cleanupTestEnvironment()
  })

  describe('Schema Validation', () => {
    it('should validate a complete user object', () => {
      const userData = createMockUser()
      const result = UserSchema.safeParse(userData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe(userData.id)
        expect(result.data.email).toBe(userData.email)
        expect(result.data.subscription_tier).toBe(userData.subscription_tier)
      }
    })

    it('should reject invalid email format', () => {
      const invalidUser = createMockUser({ email: 'invalid-email' })
      const result = UserSchema.safeParse(invalidUser)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email')
      }
    })

    it('should reject invalid subscription tier', () => {
      const invalidUser = createMockUser({ subscription_tier: 'invalid' })
      const result = UserSchema.safeParse(invalidUser)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('subscription_tier')
      }
    })

    it('should accept valid subscription tiers', () => {
      const validTiers = ['free', 'pro', 'enterprise']

      validTiers.forEach(tier => {
        const user = createMockUser({ subscription_tier: tier })
        const result = UserSchema.safeParse(user)
        expect(result.success).toBe(true)
      })
    })

    it('should validate user creation schema', () => {
      const createUserData = {
        email: 'test@example.com',
        name: 'Test User',
        subscription_tier: 'pro',
      }

      const result = CreateUserSchema.safeParse(createUserData)
      expect(result.success).toBe(true)
    })

    it('should validate user update schema', () => {
      const updateData = {
        name: 'Updated Name',
        avatar_url: 'https://example.com/avatar.jpg',
        subscription_tier: 'enterprise',
      }

      const result = UpdateUserSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should validate user preferences schema', () => {
      const preferences = {
        theme: 'dark',
        defaultLanguage: 'python',
        autoSave: true,
        showAdvancedOptions: false,
      }

      const result = UserPreferencesSchema.safeParse(preferences)
      expect(result.success).toBe(true)
    })

    it('should apply default values in preferences schema', () => {
      const result = UserPreferencesSchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.theme).toBe('system')
        expect(result.data.defaultLanguage).toBe('javascript')
        expect(result.data.autoSave).toBe(true)
        expect(result.data.showAdvancedOptions).toBe(false)
      }
    })
  })

  describe('Model Creation and Instantiation', () => {
    it('should create a user instance with valid data', () => {
      const userData = createMockUser()
      const user = new User(userData)

      expect(user.id).toBe(userData.id)
      expect(user.email).toBe(userData.email)
      expect(user.name).toBe(userData.name)
      expect(user.subscription_tier).toBe(userData.subscription_tier)
    })

    it('should create a user with static create method', () => {
      const createData = {
        email: 'new@example.com',
        name: 'New User',
        subscription_tier: 'pro' as const,
      }

      const user = User.create(createData)

      expect(user.id).toBeDefined()
      expect(user.email).toBe(createData.email)
      expect(user.name).toBe(createData.name)
      expect(user.subscription_tier).toBe(createData.subscription_tier)
      expect(user.created_at).toBeDefined()
      expect(user.updated_at).toBeDefined()
      expect(user.last_login_at).toBeNull()
    })

    it('should create user from database row', () => {
      const rowData = createMockUser()
      mockDb.setTableData('users', [rowData])

      const user = User.fromRow(rowData)

      expect(user).toBeInstanceOf(User)
      expect(user.id).toBe(rowData.id)
      expect(user.email).toBe(rowData.email)
    })

    it('should handle null preferences in fromRow', () => {
      const rowData = createMockUser({ preferences: null })
      const user = User.fromRow(rowData)

      expect(user.preferences).toBeNull()
    })

    it('should parse JSON preferences in fromRow', () => {
      const preferences = { theme: 'dark', autoSave: true }
      const rowData = createMockUser({
        preferences: JSON.stringify(preferences),
      })

      const user = User.fromRow(rowData)
      expect(user.preferences).toEqual(preferences)
    })
  })

  describe('Database Operations', () => {
    it('should convert user to database row format', () => {
      const preferences = { theme: 'dark', autoSave: true }
      const userData = createMockUser({ preferences })
      const user = new User(userData)

      const row = user.toRow()

      expect(row.id).toBe(user.id)
      expect(row.email).toBe(user.email)
      expect(row.preferences).toBe(JSON.stringify(preferences))
      expect(row.created_at).toBe(user.created_at)
    })

    it('should handle null preferences when converting to row', () => {
      const userData = createMockUser({ preferences: null })
      const user = new User(userData)

      const row = user.toRow()
      expect(row.preferences).toBeNull()
    })

    it('should update user data', () => {
      const userData = createMockUser()
      const user = new User(userData)
      const originalUpdatedAt = user.updated_at

      // Wait a bit to ensure different timestamp
      setTimeout(() => {
        const updateData = {
          name: 'Updated Name',
          subscription_tier: 'enterprise' as const,
        }

        const updatedUser = user.update(updateData)

        expect(updatedUser.name).toBe(updateData.name)
        expect(updatedUser.subscription_tier).toBe(updateData.subscription_tier)
        expect(updatedUser.updated_at).toBeGreaterThan(originalUpdatedAt)
        expect(updatedUser.email).toBe(user.email) // Unchanged field
      }, 10)
    })

    it('should update last login timestamp', () => {
      const userData = createMockUser()
      const user = new User(userData)
      const originalUpdatedAt = user.updated_at

      setTimeout(() => {
        const updatedUser = user.updateLastLogin()

        expect(updatedUser.last_login_at).toBeGreaterThan(0)
        expect(updatedUser.last_login_at).toBeGreaterThan(originalUpdatedAt)
        expect(updatedUser.updated_at).toBeGreaterThan(originalUpdatedAt)
      }, 10)
    })
  })

  describe('Helper Methods and Business Logic', () => {
    it('should correctly identify premium users', () => {
      const freeUser = new User(createMockUser({ subscription_tier: 'free' }))
      const proUser = new User(createMockUser({ subscription_tier: 'pro' }))
      const enterpriseUser = new User(
        createMockUser({ subscription_tier: 'enterprise' })
      )

      expect(freeUser.isPremium).toBe(false)
      expect(proUser.isPremium).toBe(true)
      expect(enterpriseUser.isPremium).toBe(true)
    })

    it('should correctly identify enterprise users', () => {
      const freeUser = new User(createMockUser({ subscription_tier: 'free' }))
      const proUser = new User(createMockUser({ subscription_tier: 'pro' }))
      const enterpriseUser = new User(
        createMockUser({ subscription_tier: 'enterprise' })
      )

      expect(freeUser.isEnterprise).toBe(false)
      expect(proUser.isEnterprise).toBe(false)
      expect(enterpriseUser.isEnterprise).toBe(true)
    })

    it('should correctly determine premium feature access', () => {
      const freeUser = new User(createMockUser({ subscription_tier: 'free' }))
      const proUser = new User(createMockUser({ subscription_tier: 'pro' }))

      expect(freeUser.canAccessPremiumFeatures).toBe(false)
      expect(proUser.canAccessPremiumFeatures).toBe(true)
    })

    it('should return correct daily API limits', () => {
      const freeUser = new User(createMockUser({ subscription_tier: 'free' }))
      const proUser = new User(createMockUser({ subscription_tier: 'pro' }))
      const enterpriseUser = new User(
        createMockUser({ subscription_tier: 'enterprise' })
      )

      expect(freeUser.dailyApiLimit).toBe(100)
      expect(proUser.dailyApiLimit).toBe(1000)
      expect(enterpriseUser.dailyApiLimit).toBe(10000)
    })

    it('should return correct max file sizes', () => {
      const freeUser = new User(createMockUser({ subscription_tier: 'free' }))
      const proUser = new User(createMockUser({ subscription_tier: 'pro' }))
      const enterpriseUser = new User(
        createMockUser({ subscription_tier: 'enterprise' })
      )

      expect(freeUser.maxFileSize).toBe(10 * 1024 * 1024) // 10MB
      expect(proUser.maxFileSize).toBe(50 * 1024 * 1024) // 50MB
      expect(enterpriseUser.maxFileSize).toBe(500 * 1024 * 1024) // 500MB
    })

    it('should return correct max execution times', () => {
      const freeUser = new User(createMockUser({ subscription_tier: 'free' }))
      const proUser = new User(createMockUser({ subscription_tier: 'pro' }))
      const enterpriseUser = new User(
        createMockUser({ subscription_tier: 'enterprise' })
      )

      expect(freeUser.maxExecutionTime).toBe(5000) // 5 seconds
      expect(proUser.maxExecutionTime).toBe(15000) // 15 seconds
      expect(enterpriseUser.maxExecutionTime).toBe(60000) // 1 minute
    })

    it('should return correct file retention hours', () => {
      const freeUser = new User(createMockUser({ subscription_tier: 'free' }))
      const proUser = new User(createMockUser({ subscription_tier: 'pro' }))
      const enterpriseUser = new User(
        createMockUser({ subscription_tier: 'enterprise' })
      )

      expect(freeUser.getFileRetentionHours()).toBe(72) // 3 days
      expect(proUser.getFileRetentionHours()).toBe(168) // 7 days
      expect(enterpriseUser.getFileRetentionHours()).toBe(720) // 30 days
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing optional fields', () => {
      const minimalUserData = {
        id: 'user-123',
        email: 'test@example.com',
        name: null,
        avatar_url: null,
        subscription_tier: 'free',
        preferences: null,
        created_at: 1234567890,
        updated_at: 1234567890,
        last_login_at: null,
      }

      const user = new User(minimalUserData)

      expect(user.name).toBeNull()
      expect(user.avatar_url).toBeNull()
      expect(user.preferences).toBeNull()
      expect(user.last_login_at).toBeNull()
    })

    it('should handle invalid data in fromRow', () => {
      const invalidRow = {
        id: 'invalid-uuid',
        email: 'invalid-email',
        subscription_tier: 'invalid',
      }

      expect(() => User.fromRow(invalidRow)).toThrow()
    })

    it('should handle empty preferences object', () => {
      const userData = createMockUser({ preferences: {} })
      const user = new User(userData)

      expect(user.preferences).toEqual({})
    })

    it('should handle complex preferences object', () => {
      const complexPreferences = {
        theme: 'dark',
        defaultLanguage: 'python',
        autoSave: true,
        showAdvancedOptions: true,
        customSettings: {
          fontSize: 14,
          tabSize: 4,
          wordWrap: true,
        },
      }

      const userData = createMockUser({ preferences: complexPreferences })
      const user = new User(userData)

      expect(user.preferences).toEqual(complexPreferences)
    })
  })

  describe('SQL Queries', () => {
    it('should have all required SQL queries', () => {
      expect(USER_QUERIES.CREATE_TABLE).toBeDefined()
      expect(USER_QUERIES.INSERT).toBeDefined()
      expect(USER_QUERIES.SELECT_BY_ID).toBeDefined()
      expect(USER_QUERIES.SELECT_BY_EMAIL).toBeDefined()
      expect(USER_QUERIES.UPDATE).toBeDefined()
      expect(USER_QUERIES.DELETE).toBeDefined()
      expect(USER_QUERIES.LIST).toBeDefined()
      expect(USER_QUERIES.COUNT).toBeDefined()
    })

    it('should have proper table creation query', () => {
      expect(USER_QUERIES.CREATE_TABLE).toContain(
        'CREATE TABLE IF NOT EXISTS users'
      )
      expect(USER_QUERIES.CREATE_TABLE).toContain('id TEXT PRIMARY KEY')
      expect(USER_QUERIES.CREATE_TABLE).toContain('email TEXT UNIQUE NOT NULL')
    })

    it('should have proper index creation queries', () => {
      expect(USER_QUERIES.CREATE_INDEXES).toHaveLength(3)
      expect(USER_QUERIES.CREATE_INDEXES[0]).toContain('idx_users_email')
      expect(USER_QUERIES.CREATE_INDEXES[1]).toContain('idx_users_subscription')
      expect(USER_QUERIES.CREATE_INDEXES[2]).toContain('idx_users_last_login')
    })

    it('should have parameterized queries', () => {
      expect(USER_QUERIES.INSERT).toContain(
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      expect(USER_QUERIES.SELECT_BY_ID).toContain('WHERE id = ?')
      expect(USER_QUERIES.SELECT_BY_EMAIL).toContain('WHERE email = ?')
      expect(USER_QUERIES.DELETE).toContain('WHERE id = ?')
    })
  })

  describe('Integration with Mock Database', () => {
    it('should work with mock database operations', async () => {
      const userData = createMockUser()
      mockDb.setTableData('users', [userData])

      // Test SELECT by ID
      const selectStmt = mockDb
        .prepare(USER_QUERIES.SELECT_BY_ID)
        .bind(userData.id)
      const result = await selectStmt.first()

      expect(result).toEqual(userData)
    })

    it('should handle user creation through mock database', async () => {
      const userData = createMockUser()

      // Test INSERT
      const insertStmt = mockDb
        .prepare(USER_QUERIES.INSERT)
        .bind(
          userData.id,
          userData.email,
          userData.name,
          userData.avatar_url,
          userData.subscription_tier,
          userData.preferences ? JSON.stringify(userData.preferences) : null,
          userData.created_at,
          userData.updated_at,
          userData.last_login_at
        )

      const result = await insertStmt.run()
      expect(result.success).toBe(true)
      expect(result.meta.changes).toBe(1)

      // Verify data was inserted
      const storedData = mockDb.getTableData('users')
      expect(storedData).toHaveLength(1)
      expect(storedData[0].id).toBe(userData.id)
    })

    it('should handle user updates through mock database', async () => {
      const userData = createMockUser()
      mockDb.setTableData('users', [userData])

      const updatedName = 'Updated Name'
      const now = Math.floor(Date.now() / 1000)

      // Test UPDATE
      const updateStmt = mockDb
        .prepare(USER_QUERIES.UPDATE)
        .bind(
          updatedName,
          userData.avatar_url,
          userData.subscription_tier,
          userData.preferences ? JSON.stringify(userData.preferences) : null,
          now,
          userData.last_login_at,
          userData.id
        )

      const result = await updateStmt.run()
      expect(result.success).toBe(true)
      expect(result.meta.changes).toBe(1)
    })

    it('should handle user deletion through mock database', async () => {
      const userData = createMockUser()
      mockDb.setTableData('users', [userData])

      // Test DELETE
      const deleteStmt = mockDb.prepare(USER_QUERIES.DELETE).bind(userData.id)
      const result = await deleteStmt.run()

      expect(result.success).toBe(true)
      expect(result.meta.changes).toBe(1)

      // Verify data was deleted
      const storedData = mockDb.getTableData('users')
      expect(storedData).toHaveLength(0)
    })
  })
})
