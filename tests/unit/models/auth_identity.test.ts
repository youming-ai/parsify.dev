import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  AuthIdentity,
  AuthIdentitySchema,
  CreateAuthIdentitySchema,
  OAuthProviderSchema,
  GoogleProviderDataSchema,
  GitHubProviderDataSchema,
  OAuth2ProviderDataSchema,
  AUTH_IDENTITY_QUERIES
} from '../../../../apps/api/src/models/auth_identity'
import {
  createTestDatabase,
  createMockAuthIdentity,
  setupTestEnvironment,
  cleanupTestEnvironment
} from './database.mock'

describe('AuthIdentity Model', () => {
  let mockDb: any

  beforeEach(() => {
    setupTestEnvironment()
    mockDb = createTestDatabase()
  })

  afterEach(() => {
    cleanupTestEnvironment()
  })

  describe('Schema Validation', () => {
    it('should validate a complete auth identity object', () => {
      const authData = createMockAuthIdentity()
      const result = AuthIdentitySchema.safeParse(authData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe(authData.id)
        expect(result.data.user_id).toBe(authData.user_id)
        expect(result.data.provider).toBe(authData.provider)
      }
    })

    it('should reject invalid provider', () => {
      const invalidAuth = createMockAuthIdentity({ provider: 'invalid' })
      const result = AuthIdentitySchema.safeParse(invalidAuth)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('provider')
      }
    })

    it('should accept valid OAuth providers', () => {
      const validProviders = ['google', 'github', 'oauth2']

      validProviders.forEach(provider => {
        const auth = createMockAuthIdentity({ provider: provider as any })
        const result = AuthIdentitySchema.safeParse(auth)
        expect(result.success).toBe(true)
      })
    })

    it('should validate auth identity creation schema', () => {
      const createData = {
        user_id: 'user-123',
        provider: 'google' as const,
        provider_uid: 'google-123',
        provider_data: {
          sub: 'google-123',
          email: 'test@example.com',
          name: 'Test User'
        }
      }

      const result = CreateAuthIdentitySchema.safeParse(createData)
      expect(result.success).toBe(true)
    })

    it('should validate Google provider data schema', () => {
      const googleData = {
        sub: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
        email_verified: true,
        locale: 'en'
      }

      const result = GoogleProviderDataSchema.safeParse(googleData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid Google provider data', () => {
      const invalidGoogleData = {
        sub: 'google-123',
        email: 'invalid-email',
        name: 'Test User'
      }

      const result = GoogleProviderDataSchema.safeParse(invalidGoogleData)
      expect(result.success).toBe(false)
    })

    it('should validate GitHub provider data schema', () => {
      const githubData = {
        id: 12345,
        login: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        avatar_url: 'https://example.com/avatar.jpg',
        html_url: 'https://github.com/testuser',
        bio: 'Test bio',
        location: 'Test location',
        company: 'Test company',
        blog: 'https://testuser.blog',
        public_repos: 10,
        followers: 5,
        following: 3,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }

      const result = GitHubProviderDataSchema.safeParse(githubData)
      expect(result.success).toBe(true)
    })

    it('should validate OAuth2 provider data schema', () => {
      const oauth2Data = {
        sub: 'oauth2-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
        email_verified: true,
        locale: 'en',
        provider: 'custom',
        raw_data: { custom_field: 'value' }
      }

      const result = OAuth2ProviderDataSchema.safeParse(oauth2Data)
      expect(result.success).toBe(true)
    })
  })

  describe('Model Creation and Instantiation', () => {
    it('should create an auth identity instance with valid data', () => {
      const authData = createMockAuthIdentity()
      const authIdentity = new AuthIdentity(authData)

      expect(authIdentity.id).toBe(authData.id)
      expect(authIdentity.user_id).toBe(authData.user_id)
      expect(authIdentity.provider).toBe(authData.provider)
      expect(authIdentity.provider_uid).toBe(authData.provider_uid)
    })

    it('should create an auth identity with static create method', () => {
      const createData = {
        user_id: 'user-456',
        provider: 'github' as const,
        provider_uid: 'github-456',
        provider_data: {
          id: 456,
          login: 'testuser',
          name: 'Test User'
        }
      }

      const authIdentity = AuthIdentity.create(createData)

      expect(authIdentity.id).toBeDefined()
      expect(authIdentity.user_id).toBe(createData.user_id)
      expect(authIdentity.provider).toBe(createData.provider)
      expect(authIdentity.provider_uid).toBe(createData.provider_uid)
      expect(authIdentity.created_at).toBeDefined()
    })

    it('should create auth identity from Google data', () => {
      const googleData = {
        sub: 'google-789',
        email: 'google@example.com',
        name: 'Google User',
        picture: 'https://example.com/google-avatar.jpg',
        email_verified: true
      }
      const userId = 'user-789'

      const authIdentity = AuthIdentity.fromGoogle(googleData, userId)

      expect(authIdentity.provider).toBe('google')
      expect(authIdentity.provider_uid).toBe(googleData.sub)
      expect(authIdentity.user_id).toBe(userId)
      expect(authIdentity.provider_data).toEqual(googleData)
    })

    it('should create auth identity from GitHub data', () => {
      const githubData = {
        id: 789,
        login: 'githubuser',
        name: 'GitHub User',
        email: 'github@example.com',
        avatar_url: 'https://github.com/avatar.jpg',
        html_url: 'https://github.com/githubuser',
        bio: null,
        location: null,
        company: null,
        blog: null,
        public_repos: 5,
        followers: 2,
        following: 1,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }
      const userId = 'user-789'

      const authIdentity = AuthIdentity.fromGitHub(githubData, userId)

      expect(authIdentity.provider).toBe('github')
      expect(authIdentity.provider_uid).toBe('789')
      expect(authIdentity.user_id).toBe(userId)
      expect(authIdentity.provider_data).toEqual(githubData)
    })

    it('should create auth identity from OAuth2 data', () => {
      const oauth2Data = {
        sub: 'oauth2-789',
        email: 'oauth2@example.com',
        name: 'OAuth2 User',
        email_verified: true,
        provider: 'custom-oauth2',
        raw_data: { custom_field: 'custom_value' }
      }
      const userId = 'user-789'

      const authIdentity = AuthIdentity.fromOAuth2(oauth2Data, userId)

      expect(authIdentity.provider).toBe('oauth2')
      expect(authIdentity.provider_uid).toBe(oauth2Data.sub)
      expect(authIdentity.user_id).toBe(userId)
      expect(authIdentity.provider_data).toEqual(oauth2Data)
    })

    it('should create auth identity from database row', () => {
      const rowData = createMockAuthIdentity()
      mockDb.setTableData('auth_identities', [rowData])

      const authIdentity = AuthIdentity.fromRow(rowData)

      expect(authIdentity).toBeInstanceOf(AuthIdentity)
      expect(authIdentity.id).toBe(rowData.id)
      expect(authIdentity.provider).toBe(rowData.provider)
    })

    it('should parse JSON provider_data in fromRow', () => {
      const providerData = { sub: 'google-123', email: 'test@example.com' }
      const rowData = createMockAuthIdentity({
        provider_data: JSON.stringify(providerData)
      })

      const authIdentity = AuthIdentity.fromRow(rowData)
      expect(authIdentity.provider_data).toEqual(providerData)
    })

    it('should handle null provider_data in fromRow', () => {
      const rowData = createMockAuthIdentity({ provider_data: null })
      const authIdentity = AuthIdentity.fromRow(rowData)

      expect(authIdentity.provider_data).toBeNull()
    })
  })

  describe('Database Operations', () => {
    it('should convert auth identity to database row format', () => {
      const providerData = { sub: 'google-123', email: 'test@example.com' }
      const authData = createMockAuthIdentity({ provider_data })
      const authIdentity = new AuthIdentity(authData)

      const row = authIdentity.toRow()

      expect(row.id).toBe(authIdentity.id)
      expect(row.user_id).toBe(authIdentity.user_id)
      expect(row.provider).toBe(authIdentity.provider)
      expect(row.provider_data).toBe(JSON.stringify(providerData))
    })

    it('should handle null provider_data when converting to row', () => {
      const authData = createMockAuthIdentity({ provider_data: null })
      const authIdentity = new AuthIdentity(authData)

      const row = authIdentity.toRow()
      expect(row.provider_data).toBeNull()
    })
  })

  describe('Helper Methods and Business Logic', () => {
    it('should return correct display name for Google provider', () => {
      const googleData = {
        sub: 'google-123',
        email: 'test@example.com',
        name: 'John Doe'
      }
      const authIdentity = AuthIdentity.fromGoogle(googleData, 'user-123')

      expect(authIdentity.displayName).toBe('John Doe')
    })

    it('should return correct display name for GitHub provider', () => {
      const githubData = {
        id: 123,
        login: 'johndoe',
        name: 'John Doe',
        email: 'john@example.com',
        avatar_url: 'https://github.com/avatar.jpg',
        html_url: 'https://github.com/johndoe',
        bio: null,
        location: null,
        company: null,
        blog: null,
        public_repos: 0,
        followers: 0,
        following: 0,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }
      const authIdentity = AuthIdentity.fromGitHub(githubData, 'user-123')

      expect(authIdentity.displayName).toBe('johndoe')
    })

    it('should return correct display name for OAuth2 provider', () => {
      const oauth2Data = {
        sub: 'oauth2-123',
        email: 'test@example.com',
        name: 'Jane Doe'
      }
      const authIdentity = AuthIdentity.fromOAuth2(oauth2Data, 'user-123')

      expect(authIdentity.displayName).toBe('Jane Doe')
    })

    it('should return provider_uid as display name when no provider data', () => {
      const authData = createMockAuthIdentity({ provider_data: null })
      const authIdentity = new AuthIdentity(authData)

      expect(authIdentity.displayName).toBe(authIdentity.provider_uid)
    })

    it('should return correct email for Google provider', () => {
      const googleData = {
        sub: 'google-123',
        email: 'google@example.com',
        name: 'Google User'
      }
      const authIdentity = AuthIdentity.fromGoogle(googleData, 'user-123')

      expect(authIdentity.email).toBe('google@example.com')
    })

    it('should return correct email for GitHub provider', () => {
      const githubData = {
        id: 123,
        login: 'githubuser',
        name: 'GitHub User',
        email: 'github@example.com',
        avatar_url: 'https://github.com/avatar.jpg',
        html_url: 'https://github.com/githubuser',
        bio: null,
        location: null,
        company: null,
        blog: null,
        public_repos: 0,
        followers: 0,
        following: 0,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }
      const authIdentity = AuthIdentity.fromGitHub(githubData, 'user-123')

      expect(authIdentity.email).toBe('github@example.com')
    })

    it('should return null for GitHub email when not available', () => {
      const githubData = {
        id: 123,
        login: 'githubuser',
        name: 'GitHub User',
        email: null,
        avatar_url: 'https://github.com/avatar.jpg',
        html_url: 'https://github.com/githubuser',
        bio: null,
        location: null,
        company: null,
        blog: null,
        public_repos: 0,
        followers: 0,
        following: 0,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }
      const authIdentity = AuthIdentity.fromGitHub(githubData, 'user-123')

      expect(authIdentity.email).toBeNull()
    })

    it('should return correct avatar URL for Google provider', () => {
      const googleData = {
        sub: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://google.com/avatar.jpg'
      }
      const authIdentity = AuthIdentity.fromGoogle(googleData, 'user-123')

      expect(authIdentity.avatarUrl).toBe('https://google.com/avatar.jpg')
    })

    it('should return correct avatar URL for GitHub provider', () => {
      const githubData = {
        id: 123,
        login: 'githubuser',
        name: 'GitHub User',
        email: 'github@example.com',
        avatar_url: 'https://github.com/avatar.jpg',
        html_url: 'https://github.com/githubuser',
        bio: null,
        location: null,
        company: null,
        blog: null,
        public_repos: 0,
        followers: 0,
        following: 0,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }
      const authIdentity = AuthIdentity.fromGitHub(githubData, 'user-123')

      expect(authIdentity.avatarUrl).toBe('https://github.com/avatar.jpg')
    })

    it('should return correct avatar URL for OAuth2 provider', () => {
      const oauth2Data = {
        sub: 'oauth2-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://oauth2.com/avatar.jpg'
      }
      const authIdentity = AuthIdentity.fromOAuth2(oauth2Data, 'user-123')

      expect(authIdentity.avatarUrl).toBe('https://oauth2.com/avatar.jpg')
    })

    it('should return null avatar URL for OAuth2 provider when not available', () => {
      const oauth2Data = {
        sub: 'oauth2-123',
        email: 'test@example.com',
        name: 'Test User'
      }
      const authIdentity = AuthIdentity.fromOAuth2(oauth2Data, 'user-123')

      expect(authIdentity.avatarUrl).toBeNull()
    })

    it('should return correct email verification status for Google provider', () => {
      const verifiedGoogleData = {
        sub: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        email_verified: true
      }
      const unverifiedGoogleData = {
        sub: 'google-456',
        email: 'unverified@example.com',
        name: 'Unverified User',
        email_verified: false
      }

      const verifiedAuth = AuthIdentity.fromGoogle(verifiedGoogleData, 'user-123')
      const unverifiedAuth = AuthIdentity.fromGoogle(unverifiedGoogleData, 'user-456')

      expect(verifiedAuth.isEmailVerified).toBe(true)
      expect(unverifiedAuth.isEmailVerified).toBe(false)
    })

    it('should return true email verification status for GitHub provider', () => {
      const githubData = {
        id: 123,
        login: 'githubuser',
        name: 'GitHub User',
        email: 'github@example.com',
        avatar_url: 'https://github.com/avatar.jpg',
        html_url: 'https://github.com/githubuser',
        bio: null,
        location: null,
        company: null,
        blog: null,
        public_repos: 0,
        followers: 0,
        following: 0,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }
      const authIdentity = AuthIdentity.fromGitHub(githubData, 'user-123')

      expect(authIdentity.isEmailVerified).toBe(true)
    })

    it('should return correct email verification status for OAuth2 provider', () => {
      const verifiedOAuth2Data = {
        sub: 'oauth2-123',
        email: 'test@example.com',
        name: 'Test User',
        email_verified: true
      }
      const unverifiedOAuth2Data = {
        sub: 'oauth2-456',
        email: 'unverified@example.com',
        name: 'Unverified User',
        email_verified: false
      }

      const verifiedAuth = AuthIdentity.fromOAuth2(verifiedOAuth2Data, 'user-123')
      const unverifiedAuth = AuthIdentity.fromOAuth2(unverifiedOAuth2Data, 'user-456')

      expect(verifiedAuth.isEmailVerified).toBe(true)
      expect(unverifiedAuth.isEmailVerified).toBe(false)
    })

    it('should return false email verification status when no provider data', () => {
      const authData = createMockAuthIdentity({ provider_data: null })
      const authIdentity = new AuthIdentity(authData)

      expect(authIdentity.isEmailVerified).toBe(false)
    })

    it('should return correct profile URL for GitHub provider', () => {
      const githubData = {
        id: 123,
        login: 'githubuser',
        name: 'GitHub User',
        email: 'github@example.com',
        avatar_url: 'https://github.com/avatar.jpg',
        html_url: 'https://github.com/githubuser',
        bio: null,
        location: null,
        company: null,
        blog: null,
        public_repos: 0,
        followers: 0,
        following: 0,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }
      const authIdentity = AuthIdentity.fromGitHub(githubData, 'user-123')

      expect(authIdentity.profileUrl).toBe('https://github.com/githubuser')
    })

    it('should return null profile URL for Google provider', () => {
      const googleData = {
        sub: 'google-123',
        email: 'test@example.com',
        name: 'Google User'
      }
      const authIdentity = AuthIdentity.fromGoogle(googleData, 'user-123')

      expect(authIdentity.profileUrl).toBeNull()
    })

    it('should return null profile URL for OAuth2 provider', () => {
      const oauth2Data = {
        sub: 'oauth2-123',
        email: 'test@example.com',
        name: 'OAuth2 User'
      }
      const authIdentity = AuthIdentity.fromOAuth2(oauth2Data, 'user-123')

      expect(authIdentity.profileUrl).toBeNull()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing optional fields', () => {
      const minimalAuthData = {
        id: 'auth-123',
        user_id: 'user-123',
        provider: 'google' as const,
        provider_uid: 'google-123',
        provider_data: null,
        created_at: 1234567890
      }

      const authIdentity = new AuthIdentity(minimalAuthData)

      expect(authIdentity.provider_data).toBeNull()
    })

    it('should handle invalid data in fromRow', () => {
      const invalidRow = {
        id: 'invalid-uuid',
        user_id: 'invalid-uuid',
        provider: 'invalid',
        provider_uid: 'test-123'
      }

      expect(() => AuthIdentity.fromRow(invalidRow)).toThrow()
    })

    it('should handle empty provider data object', () => {
      const authData = createMockAuthIdentity({ provider_data: {} })
      const authIdentity = new AuthIdentity(authData)

      expect(authIdentity.provider_data).toEqual({})
      expect(authIdentity.displayName).toBe(authIdentity.provider_uid)
      expect(authIdentity.email).toBeNull()
      expect(authIdentity.avatarUrl).toBeNull()
      expect(authIdentity.isEmailVerified).toBe(false)
    })

    it('should handle malformed JSON in provider_data', () => {
      const rowData = createMockAuthIdentity({
        provider_data: 'invalid json string'
      })

      expect(() => AuthIdentity.fromRow(rowData)).toThrow()
    })
  })

  describe('SQL Queries', () => {
    it('should have all required SQL queries', () => {
      expect(AUTH_IDENTITY_QUERIES.CREATE_TABLE).toBeDefined()
      expect(AUTH_IDENTITY_QUERIES.INSERT).toBeDefined()
      expect(AUTH_IDENTITY_QUERIES.SELECT_BY_ID).toBeDefined()
      expect(AUTH_IDENTITY_QUERIES.SELECT_BY_USER_ID).toBeDefined()
      expect(AUTH_IDENTITY_QUERIES.SELECT_BY_PROVIDER_AND_UID).toBeDefined()
      expect(AUTH_IDENTITY_QUERIES.SELECT_BY_USER_ID_AND_PROVIDER).toBeDefined()
      expect(AUTH_IDENTITY_QUERIES.UPDATE).toBeDefined()
      expect(AUTH_IDENTITY_QUERIES.DELETE).toBeDefined()
      expect(AUTH_IDENTITY_QUERIES.DELETE_BY_USER_ID).toBeDefined()
      expect(AUTH_IDENTITY_QUERIES.COUNT_BY_USER).toBeDefined()
      expect(AUTH_IDENTITY_QUERIES.LIST_BY_PROVIDER).toBeDefined()
    })

    it('should have proper table creation query', () => {
      expect(AUTH_IDENTITY_QUERIES.CREATE_TABLE).toContain('CREATE TABLE IF NOT EXISTS auth_identities')
      expect(AUTH_IDENTITY_QUERIES.CREATE_TABLE).toContain('id TEXT PRIMARY KEY')
      expect(AUTH_IDENTITY_QUERIES.CREATE_TABLE).toContain('FOREIGN KEY (user_id) REFERENCES users(id)')
      expect(AUTH_IDENTITY_QUERIES.CREATE_TABLE).toContain('UNIQUE(provider, provider_uid)')
    })

    it('should have proper index creation queries', () => {
      expect(AUTH_IDENTITY_QUERIES.CREATE_INDEXES).toHaveLength(2)
      expect(AUTH_IDENTITY_QUERIES.CREATE_INDEXES[0]).toContain('idx_auth_identities_user_id')
      expect(AUTH_IDENTITY_QUERIES.CREATE_INDEXES[1]).toContain('idx_auth_identities_provider')
    })

    it('should have parameterized queries', () => {
      expect(AUTH_IDENTITY_QUERIES.INSERT).toContain('VALUES (?, ?, ?, ?, ?, ?)')
      expect(AUTH_IDENTITY_QUERIES.SELECT_BY_ID).toContain('WHERE id = ?')
      expect(AUTH_IDENTITY_QUERIES.SELECT_BY_USER_ID).toContain('WHERE user_id = ?')
      expect(AUTH_IDENTITY_QUERIES.SELECT_BY_PROVIDER_AND_UID).toContain('WHERE provider = ? AND provider_uid = ?')
      expect(AUTH_IDENTITY_QUERIES.DELETE).toContain('WHERE id = ?')
    })
  })

  describe('Integration with Mock Database', () => {
    it('should work with mock database operations', async () => {
      const authData = createMockAuthIdentity()
      mockDb.setTableData('auth_identities', [authData])

      // Test SELECT by ID
      const selectStmt = mockDb.prepare(AUTH_IDENTITY_QUERIES.SELECT_BY_ID).bind(authData.id)
      const result = await selectStmt.first()

      expect(result).toEqual(authData)
    })

    it('should handle auth identity creation through mock database', async () => {
      const authData = createMockAuthIdentity()

      // Test INSERT
      const insertStmt = mockDb.prepare(AUTH_IDENTITY_QUERIES.INSERT).bind(
        authData.id,
        authData.user_id,
        authData.provider,
        authData.provider_uid,
        authData.provider_data,
        authData.created_at
      )

      const result = await insertStmt.run()
      expect(result.success).toBe(true)
      expect(result.meta.changes).toBe(1)

      // Verify data was inserted
      const storedData = mockDb.getTableData('auth_identities')
      expect(storedData).toHaveLength(1)
      expect(storedData[0].id).toBe(authData.id)
    })

    it('should handle auth identity lookup by provider and UID', async () => {
      const authData = createMockAuthIdentity()
      mockDb.setTableData('auth_identities', [authData])

      // Test SELECT by provider and UID
      const selectStmt = mockDb.prepare(AUTH_IDENTITY_QUERIES.SELECT_BY_PROVIDER_AND_UID).bind(
        authData.provider,
        authData.provider_uid
      )
      const result = await selectStmt.first()

      expect(result).toEqual(authData)
    })

    it('should handle auth identity lookup by user ID', async () => {
      const authData = createMockAuthIdentity()
      mockDb.setTableData('auth_identities', [authData])

      // Test SELECT by user ID
      const selectStmt = mockDb.prepare(AUTH_IDENTITY_QUERIES.SELECT_BY_USER_ID).bind(authData.user_id)
      const result = await selectStmt.all()

      expect(result.results).toHaveLength(1)
      expect(result.results[0]).toEqual(authData)
    })

    it('should handle auth identity updates through mock database', async () => {
      const authData = createMockAuthIdentity()
      mockDb.setTableData('auth_identities', [authData])

      const updatedProviderData = { sub: 'updated-google-123', email: 'updated@example.com' }

      // Test UPDATE
      const updateStmt = mockDb.prepare(AUTH_IDENTITY_QUERIES.UPDATE).bind(
        JSON.stringify(updatedProviderData),
        authData.id
      )

      const result = await updateStmt.run()
      expect(result.success).toBe(true)
      expect(result.meta.changes).toBe(1)
    })

    it('should handle auth identity deletion through mock database', async () => {
      const authData = createMockAuthIdentity()
      mockDb.setTableData('auth_identities', [authData])

      // Test DELETE
      const deleteStmt = mockDb.prepare(AUTH_IDENTITY_QUERIES.DELETE).bind(authData.id)
      const result = await deleteStmt.run()

      expect(result.success).toBe(true)
      expect(result.meta.changes).toBe(1)

      // Verify data was deleted
      const storedData = mockDb.getTableData('auth_identities')
      expect(storedData).toHaveLength(0)
    })

    it('should handle counting auth identities by user', async () => {
      const userId = 'user-123'
      const authIdentities = [
        createMockAuthIdentity({ user_id: userId, provider: 'google' }),
        createMockAuthIdentity({ user_id: userId, provider: 'github' })
      ]
      mockDb.setTableData('auth_identities', authIdentities)

      // Test COUNT
      const countStmt = mockDb.prepare(AUTH_IDENTITY_QUERIES.COUNT_BY_USER).bind(userId)
      const result = await countStmt.first()

      expect(result.count).toBe(2)
    })
  })
})
