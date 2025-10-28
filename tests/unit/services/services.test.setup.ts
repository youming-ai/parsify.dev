/**
 * Services Test Setup
 *
 * This file contains the setup and utilities for testing services.
 * It includes common mocks and test utilities that can be used across
 * all service test files.
 */

// Mock Cloudflare Workers environment
global.D1Database = class MockD1Database {
  prepare(_query: string) {
    return {
      bind: (..._args: any[]) => this,
      first: async () => null,
      run: async () => ({ success: true }),
      all: async () => ({ results: [] }),
    }
  }

  async batch() {
    return { results: [] }
  }

  async dump() {
    return []
  }
} as any

global.R2Bucket = class MockR2Bucket {
  async head() {
    return null
  }

  async get() {
    return null
  }

  async put() {
    return null
  }

  async delete() {
    return null
  }

  async list() {
    return { objects: [] }
  }
} as any

global.KVNamespace = class MockKVNamespace {
  async get() {
    return null
  }

  async put() {
    return null
  }

  async delete() {
    return null
  }

  async list() {
    return { keys: [] }
  }
} as any

// Test utilities
export const createMockEnv = () => ({
  DB: new global.D1Database(),
  R2: new global.R2Bucket(),
  KV: new global.KVNamespace(),
})

export const createMockServiceOptions = (overrides = {}) => ({
  db: createMockEnv().DB,
  kv: createMockEnv().KV,
  auditEnabled: false,
  enableAdvancedCaching: false,
  ...overrides,
})

// Common test data
export const mockUserData = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  subscription_tier: 'free' as const,
  created_at: Math.floor(Date.now() / 1000),
  updated_at: Math.floor(Date.now() / 1000),
}

export const mockAuthData = {
  id: 'test-auth-id',
  user_id: 'test-user-id',
  provider: 'google' as const,
  provider_uid: 'google-123',
  created_at: Math.floor(Date.now() / 1000),
}

export const mockToolData = {
  id: 'test-tool-id',
  slug: 'test-tool',
  name: 'Test Tool',
  category: 'test',
  description: 'A test tool',
  enabled: true,
  beta: false,
  created_at: Math.floor(Date.now() / 1000),
  updated_at: Math.floor(Date.now() / 1000),
}

export const mockJobData = {
  id: 'test-job-id',
  user_id: 'test-user-id',
  tool_id: 'test-tool-id',
  status: 'pending' as const,
  input_data: { test: 'data' },
  created_at: Math.floor(Date.now() / 1000),
  updated_at: Math.floor(Date.now() / 1000),
}

export const mockFileData = {
  id: 'test-file-id',
  user_id: 'test-user-id',
  filename: 'test.json',
  size: 1024,
  content_type: 'application/json',
  created_at: Math.floor(Date.now() / 1000),
  expires_at: Math.floor(Date.now() / 1000) + 259200, // 72 hours
}

export const mockQuotaData = {
  id: 'test-quota-id',
  user_id: 'test-user-id',
  quota_type: 'api_requests',
  period: 'hour' as const,
  used_count: 10,
  limit_count: 100,
  created_at: Math.floor(Date.now() / 1000),
  updated_at: Math.floor(Date.now() / 1000),
}
