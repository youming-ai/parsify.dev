// Test setup file for Vitest
// This file runs before each test file

// Mock Web Crypto API for Cloudflare Workers environment
if (!global.crypto) {
  ;(global as any).crypto = {
    randomUUID: () => `test-uuid-${Math.random().toString(36).substr(2, 9)}`,
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    },
  }
}

// Mock Cloudflare Workers environment variables
process.env.CLOUDFLARE_ACCOUNT_ID = 'test-account-id'
process.env.CLOUDFLARE_API_TOKEN = 'test-api-token'

// Mock fetch API if not available
if (!global.fetch) {
  global.fetch = async () => {
    throw new Error('fetch not implemented in test environment')
  }
}
