import { describe, it, expect, beforeAll } from 'vitest'
import { app } from '../../apps/api/src/index'

describe('JSON Formatting Workflow Integration', () => {
  let testEnv: any

  beforeAll(() => {
    testEnv = {
      ENVIRONMENT: 'test',
    }
  })

  it('should complete full JSON formatting workflow', async () => {
    const sampleJson = {
      user: {
        name: "John Doe",
        age: 30,
        preferences: {
          theme: "dark",
          notifications: true
        }
      },
      metadata: {
        created: "2023-01-01",
        updated: "2023-12-01"
      }
    }

    // Step 1: Format the JSON
    const formatRes = await app.request('/api/v1/tools/json/format', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: JSON.stringify(sampleJson),
        indent: 2,
        sort_keys: true
      })
    }, testEnv)

    expect(formatRes.status).toBe(200)
    const formatData = await formatRes.json()
    expect(formatData.valid).toBe(true)

    // Step 2: Validate the formatted JSON
    const validateRes = await app.request('/api/v1/tools/json/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: formatData.formatted
      })
    }, testEnv)

    expect(validateRes.status).toBe(200)
    const validateData = await validateRes.json()
    expect(validateData.valid).toBe(true)

    // Step 3: Convert to CSV (if available in MVP)
    const convertRes = await app.request('/api/v1/tools/json/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: formatData.formatted,
        target_format: 'csv'
      })
    }, testEnv)

    // Note: This might not be implemented yet in MVP
    if (convertRes.status === 200) {
      const convertData = await convertRes.json()
      expect(convertData).toHaveProperty('converted')
      expect(convertData.format).toBe('csv')
    }
  })

  it('should handle large JSON files within MVP limits', async () => {
    // Create a JSON file close to the 10MB limit
    const largeArray = Array(1000).fill(null).map((_, i) => ({
      id: i,
      data: 'x'.repeat(10000), // 10KB per item
      nested: {
        value: i,
        text: 'Sample text that adds some size to the object'
      }
    }))

    const largeJson = JSON.stringify(largeArray)

    // Should be close to 10MB
    expect(largeJson.length).toBeGreaterThan(9_000_000) // 9MB
    expect(largeJson.length).toBeLessThan(11_000_000) // 11MB

    const res = await app.request('/api/v1/tools/json/format', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: largeJson,
        indent: 2
      })
    }, testEnv)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.valid).toBe(true)
  })

  it('should reject files exceeding size limits', async () => {
    // Create a JSON that would exceed 10MB limit
    const hugeArray = Array(2000).fill(null).map((_, i) => ({
      id: i,
      data: 'x'.repeat(10000) // 10KB per item = 20MB total
    }))

    const hugeJson = JSON.stringify(hugeArray)

    const res = await app.request('/api/v1/tools/json/format', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: hugeJson,
        indent: 2
      })
    }, testEnv)

    // Should handle size limit appropriately
    expect(res.status).toBe(413) // Payload Too Large
  })

  it('should maintain JSON structure integrity through multiple operations', async () => {
    const originalJson = {
      users: [
        { id: 1, name: "Alice", active: true },
        { id: 2, name: "Bob", active: false }
      ],
      settings: {
        theme: "dark",
        language: "en",
        features: ["notifications", "analytics"]
      },
      timestamp: "2023-12-01T12:00:00Z"
    }

    // Format
    const formatRes = await app.request('/api/v1/tools/json/format', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: JSON.stringify(originalJson),
        indent: 4,
        sort_keys: false
      })
    }, testEnv)

    expect(formatRes.status).toBe(200)
    const formatData = await formatRes.json()

    // Parse back and verify structure
    const parsed = JSON.parse(formatData.formatted)
    expect(parsed).toEqual(originalJson)
  })
})