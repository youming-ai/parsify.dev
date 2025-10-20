import { z } from 'zod'

// User schema for validation
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  subscription_tier: z.enum(['free', 'pro', 'enterprise']).default('free'),
  preferences: z.record(z.any()).nullable(),
  created_at: z.number(),
  updated_at: z.number(),
  last_login_at: z.number().nullable()
})

export type User = z.infer<typeof UserSchema>

// User creation schema
export const CreateUserSchema = UserSchema.partial({
  id: true,
  created_at: true,
  updated_at: true,
  last_login_at: true
})

export type CreateUser = z.infer<typeof CreateUserSchema>

// User update schema
export const UpdateUserSchema = UserSchema.partial({
  id: true,
  email: true,
  created_at: true
})

export type UpdateUser = z.infer<typeof UpdateUserSchema>

// User preferences schema
export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  defaultLanguage: z.string().default('javascript'),
  autoSave: z.boolean().default(true),
  showAdvancedOptions: z.boolean().default(false)
})

export type UserPreferences = z.infer<typeof UserPreferencesSchema>

// User model class
export class User {
  public id: string
  public email: string
  public name: string | null
  public avatar_url: string | null
  public subscription_tier: 'free' | 'pro' | 'enterprise'
  public preferences: UserPreferences | null
  public created_at: number
  public updated_at: number
  public last_login_at: number | null

  constructor(data: User) {
    this.id = data.id
    this.email = data.email
    this.name = data.name
    this.avatar_url = data.avatar_url
    this.subscription_tier = data.subscription_tier
    this.preferences = data.preferences
    this.created_at = data.created_at
    this.updated_at = data.updated_at
    this.last_login_at = data.last_login_at
  }

  // Static methods for database operations
  static create(data: CreateUser): User {
    const now = Math.floor(Date.now() / 1000)
    return new User({
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
      last_login_at: null,
      subscription_tier: 'free',
      preferences: null,
      ...data
    })
  }

  static fromRow(row: any): User {
    return new User(UserSchema.parse(row))
  }

  toRow(): Record<string, any> {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      avatar_url: this.avatar_url,
      subscription_tier: this.subscription_tier,
      preferences: this.preferences ? JSON.stringify(this.preferences) : null,
      created_at: this.created_at,
      updated_at: this.updated_at,
      last_login_at: this.last_login_at
    }
  }

  update(data: UpdateUser): User {
    const updatedUser = new User({
      ...this,
      ...data,
      updated_at: Math.floor(Date.now() / 1000)
    })
    return updatedUser
  }

  updateLastLogin(): User {
    return new User({
      ...this,
      last_login_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000)
    })
  }

  // Helper methods
  get isPremium(): boolean {
    return this.subscription_tier !== 'free'
  }

  get isEnterprise(): boolean {
    return this.subscription_tier === 'enterprise'
  }

  get canAccessPremiumFeatures(): boolean {
    return this.isPremium
  }

  get dailyApiLimit(): number {
    switch (this.subscription_tier) {
      case 'free':
        return 100
      case 'pro':
        return 1000
      case 'enterprise':
        return 10000
      default:
        return 100
    }
  }

  get maxFileSize(): number {
    switch (this.subscription_tier) {
      case 'free':
        return 10 * 1024 * 1024 // 10MB
      case 'pro':
        return 50 * 1024 * 1024 // 50MB
      case 'enterprise':
        return 500 * 1024 * 1024 // 500MB
      default:
        return 10 * 1024 * 1024
    }
  }

  get maxExecutionTime(): number {
    switch (this.subscription_tier) {
      case 'free':
        return 5000 // 5 seconds
      case 'pro':
        return 15000 // 15 seconds
      case 'enterprise':
        return 60000 // 1 minute
      default:
        return 5000
    }
  }

  getFileRetentionHours(): number {
    switch (this.subscription_tier) {
      case 'free':
        return 72 // 3 days
      case 'pro':
        return 168 // 7 days
      case 'enterprise':
        return 720 // 30 days
      default:
        return 72
    }
  }
}

// SQL queries
export const USER_QUERIES = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      avatar_url TEXT,
      subscription_tier TEXT DEFAULT 'free',
      preferences TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      last_login_at INTEGER
    );
  `,

  CREATE_INDEXES: [
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);',
    'CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription_tier);',
    'CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);'
  ],

  INSERT: `
    INSERT INTO users (id, email, name, avatar_url, subscription_tier, preferences, created_at, updated_at, last_login_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
  `,

  SELECT_BY_ID: `
    SELECT * FROM users WHERE id = ?;
  `,

  SELECT_BY_EMAIL: `
    SELECT * FROM users WHERE email = ?;
  `,

  UPDATE: `
    UPDATE users
    SET name = ?, avatar_url = ?, subscription_tier = ?, preferences = ?, updated_at = ?, last_login_at = ?
    WHERE id = ?;
  `,

  UPDATE_LAST_LOGIN: `
    UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?;
  `,

  DELETE: `
    DELETE FROM users WHERE id = ?;
  `,

  LIST: `
    SELECT * FROM users
    WHERE subscription_tier = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?;
  `,

  COUNT: `
    SELECT COUNT(*) as count FROM users WHERE subscription_tier = ?;
  `
} as const