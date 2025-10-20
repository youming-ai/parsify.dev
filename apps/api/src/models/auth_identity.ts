import { z } from 'zod'

// OAuth providers
export const OAuthProviderSchema = z.enum(['google', 'github', 'oauth2'])
export type OAuthProvider = z.infer<typeof OAuthProviderSchema>

// Auth identity schema for validation
export const AuthIdentitySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  provider: OAuthProviderSchema,
  provider_uid: z.string(),
  provider_data: z.record(z.any()).nullable(),
  created_at: z.number()
})

export type AuthIdentity = z.infer<typeof AuthIdentitySchema>

// Auth identity creation schema
export const CreateAuthIdentitySchema = AuthIdentitySchema.partial({
  id: true,
  created_at: true
})

export type CreateAuthIdentity = z.infer<typeof CreateAuthIdentitySchema>

// Provider-specific data schemas
export const GoogleProviderDataSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  name: z.string(),
  picture: z.string().url(),
  email_verified: z.boolean(),
  locale: z.string().optional()
})

export const GitHubProviderDataSchema = z.object({
  id: z.number(),
  login: z.string(),
  name: z.string().nullable(),
  email: z.string().email().nullable(),
  avatar_url: z.string().url(),
  html_url: z.string().url(),
  bio: z.string().nullable(),
  location: z.string().nullable(),
  company: z.string().nullable(),
  blog: z.string().url().nullable(),
  public_repos: z.number(),
  followers: z.number(),
  following: z.number(),
  created_at: z.string(),
  updated_at: z.string()
})

export const OAuth2ProviderDataSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  name: z.string(),
  picture: z.string().url().optional(),
  email_verified: z.boolean().optional(),
  locale: z.string().optional(),
  provider: z.string(),
  raw_data: z.record(z.any())
})

export type GoogleProviderData = z.infer<typeof GoogleProviderDataSchema>
export type GitHubProviderData = z.infer<typeof GitHubProviderDataSchema>
export type OAuth2ProviderData = z.infer<typeof OAuth2ProviderDataSchema>

// Auth identity model class
export class AuthIdentity {
  public id: string
  public user_id: string
  public provider: OAuthProvider
  public provider_uid: string
  public provider_data: GoogleProviderData | GitHubProviderData | OAuth2ProviderData | null
  public created_at: number

  constructor(data: AuthIdentity) {
    this.id = data.id
    this.user_id = data.user_id
    this.provider = data.provider
    this.provider_uid = data.provider_uid
    this.provider_data = data.provider_data
    this.created_at = data.created_at
  }

  // Static methods for database operations
  static create(data: CreateAuthIdentity): AuthIdentity {
    return new AuthIdentity({
      id: crypto.randomUUID(),
      created_at: Math.floor(Date.now() / 1000),
      ...data
    })
  }

  static fromGoogle(data: GoogleProviderData, userId: string): AuthIdentity {
    return AuthIdentity.create({
      user_id: userId,
      provider: 'google',
      provider_uid: data.sub,
      provider_data: data
    })
  }

  static fromGitHub(data: GitHubProviderData, userId: string): AuthIdentity {
    return AuthIdentity.create({
      user_id: userId,
      provider: 'github',
      provider_uid: data.id.toString(),
      provider_data: data
    })
  }

  static fromOAuth2(data: OAuth2ProviderData, userId: string): AuthIdentity {
    return AuthIdentity.create({
      user_id: userId,
      provider: 'oauth2',
      provider_uid: data.sub,
      provider_data: data
    })
  }

  static fromRow(row: any): AuthIdentity {
    const parsed = AuthIdentitySchema.parse({
      ...row,
      provider_data: row.provider_data ? JSON.parse(row.provider_data) : null
    })
    return new AuthIdentity(parsed)
  }

  toRow(): Record<string, any> {
    return {
      id: this.id,
      user_id: this.user_id,
      provider: this.provider,
      provider_uid: this.provider_uid,
      provider_data: this.provider_data ? JSON.stringify(this.provider_data) : null,
      created_at: this.created_at
    }
  }

  // Helper methods
  get displayName(): string {
    if (!this.provider_data) return this.provider_uid

    switch (this.provider) {
      case 'google':
        return (this.provider_data as GoogleProviderData).name
      case 'github':
        return (this.provider_data as GitHubProviderData).login
      case 'oauth2':
        return (this.provider_data as OAuth2ProviderData).name
      default:
        return this.provider_uid
    }
  }

  get email(): string | null {
    if (!this.provider_data) return null

    switch (this.provider) {
      case 'google':
        return (this.provider_data as GoogleProviderData).email
      case 'github':
        return (this.provider_data as GitHubProviderData).email
      case 'oauth2':
        return (this.provider_data as OAuth2ProviderData).email
      default:
        return null
    }
  }

  get avatarUrl(): string | null {
    if (!this.provider_data) return null

    switch (this.provider) {
      case 'google':
        return (this.provider_data as GoogleProviderData).picture
      case 'github':
        return (this.provider_data as GitHubProviderData).avatar_url
      case 'oauth2':
        return (this.provider_data as OAuth2ProviderData).picture || null
      default:
        return null
    }
  }

  get isEmailVerified(): boolean {
    if (!this.provider_data) return false

    switch (this.provider) {
      case 'google':
        return (this.provider_data as GoogleProviderData).email_verified
      case 'github':
        return true // GitHub emails are verified by default
      case 'oauth2':
        return (this.provider_data as OAuth2ProviderData).email_verified || false
      default:
        return false
    }
  }

  get profileUrl(): string | null {
    if (!this.provider_data) return null

    switch (this.provider) {
      case 'github':
        return (this.provider_data as GitHubProviderData).html_url
      case 'google':
      case 'oauth2':
        return null // No direct profile URL for Google/OAuth2
      default:
        return null
    }
  }
}

// SQL queries
export const AUTH_IDENTITY_QUERIES = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS auth_identities (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_uid TEXT NOT NULL,
      provider_data TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(provider, provider_uid)
    );
  `,

  CREATE_INDEXES: [
    'CREATE INDEX IF NOT EXISTS idx_auth_identities_user_id ON auth_identities(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_auth_identities_provider ON auth_identities(provider);'
  ],

  INSERT: `
    INSERT INTO auth_identities (id, user_id, provider, provider_uid, provider_data, created_at)
    VALUES (?, ?, ?, ?, ?, ?);
  `,

  SELECT_BY_ID: `
    SELECT * FROM auth_identities WHERE id = ?;
  `,

  SELECT_BY_USER_ID: `
    SELECT * FROM auth_identities WHERE user_id = ? ORDER BY created_at DESC;
  `,

  SELECT_BY_PROVIDER_AND_UID: `
    SELECT * FROM auth_identities WHERE provider = ? AND provider_uid = ?;
  `,

  SELECT_BY_USER_ID_AND_PROVIDER: `
    SELECT * FROM auth_identities WHERE user_id = ? AND provider = ?;
  `,

  UPDATE: `
    UPDATE auth_identities
    SET provider_data = ?
    WHERE id = ?;
  `,

  DELETE: `
    DELETE FROM auth_identities WHERE id = ?;
  `,

  DELETE_BY_USER_ID: `
    DELETE FROM auth_identities WHERE user_id = ?;
  `,

  COUNT_BY_USER: `
    SELECT COUNT(*) as count FROM auth_identities WHERE user_id = ?;
  `,

  LIST_BY_PROVIDER: `
    SELECT ai.*, u.email as user_email, u.name as user_name
    FROM auth_identities ai
    JOIN users u ON ai.user_id = u.id
    WHERE ai.provider = ?
    ORDER BY ai.created_at DESC
    LIMIT ? OFFSET ?;
  `
} as const