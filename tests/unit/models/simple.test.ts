import { describe, expect, it } from 'vitest'

// Simple test to verify the test setup works
describe('Test Setup', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle async operations', async () => {
    const result = await Promise.resolve(42)
    expect(result).toBe(42)
  })
})
