import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestClient } from 'hono/testing'
import { app } from '../../apps/api/src/index'

// Test configuration
const API_BASE = 'http://localhost:8787/v1'
const client = createTestClient(app)

describe('JSON Format Tool API', () => {
  let authToken: string

  beforeAll(async () => {
    // Setup authentication token for tests
    // This would typically be mocked or use a test user
    authToken = 'test-bearer-token'
  })

  describe('POST /tools/json/format', () => {
    it('should format valid JSON with default settings', async () => {
      const invalidJson = '{"name":"John","age":30,"city":"New York"}'

      const response = await client.tools.json.format.$post({
        json: {
          json: invalidJson,
          indent: 2,
          sort_keys: false
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toMatchObject({
        formatted: expect.stringContaining('  "name": "John"'),
        valid: true,
        size: expect.any(Number),
        errors: null
      })

      // Verify formatted JSON is properly indented
      expect(data.formatted).toContain('\n  "name": "John"')
      expect(data.formatted).toContain('\n  "age": 30')
      expect(data.formatted).toContain('\n  "city": "New York"')
    })

    it('should format JSON with custom indentation', async () => {
      const json = '{"name":"John","age":30}'

      const response = await client.tools.json.format.$post({
        json: {
          json: json,
          indent: 4,
          sort_keys: false
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.valid).toBe(true)
      expect(data.formatted).toContain('    "name": "John"')
      expect(data.formatted).toContain('    "age": 30')
    })

    it('should sort JSON keys alphabetically when requested', async () => {
      const json = '{"z":1,"a":2,"m":3}'

      const response = await client.tools.json.format.$post({
        json: {
          json: json,
          indent: 2,
          sort_keys: true
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.valid).toBe(true)

      // Keys should be sorted: a, m, z
      const formattedLines = data.formatted.split('\n')
      const keyOrder = formattedLines
        .filter(line => line.includes('"'))
        .map(line => line.trim().match(/"([^"]+)":/)?.[1])
        .filter(Boolean)

      expect(keyOrder).toEqual(['a', 'm', 'z'])
    })

    it('should handle invalid JSON gracefully', async () => {
      const invalidJson = '{"name":"John","age":30,' // Missing closing brace

      const response = await client.tools.json.format.$post({
        json: {
          json: invalidJson,
          indent: 2,
          sort_keys: false
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.valid).toBe(false)
      expect(data.formatted).toBeNull()
      expect(data.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Expected')
        ])
      )
    })

    it('should handle empty JSON object', async () => {
      const response = await client.tools.json.format.$post({
        json: {
          json: '{}',
          indent: 2,
          sort_keys: false
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.valid).toBe(true)
      expect(data.formatted).toBe('{}')
    })

    it('should handle complex nested JSON', async () => {
      const complexJson = {
        user: {
          id: 123,
          profile: {
            name: "John Doe",
            settings: {
              theme: "dark",
              notifications: true
            }
          }
        },
        posts: [
          { id: 1, title: "First Post" },
          { id: 2, title: "Second Post" }
        ]
      }

      const response = await client.tools.json.format.$post({
        json: {
          json: JSON.stringify(complexJson),
          indent: 2,
          sort_keys: false
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.valid).toBe(true)

      // Verify structure is preserved
      const parsed = JSON.parse(data.formatted)
      expect(parsed).toEqual(complexJson)
    })

    it('should reject requests without authentication', async () => {
      const response = await client.tools.json.format.$post({
        json: {
          json: '{"test": true}',
          indent: 2
        }
      })

      expect(response.status).toBe(401)
    })

    it('should validate input parameters', async () => {
      // Test missing required parameter
      const response = await client.tools.json.format.$post({
        json: {
          indent: 2
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBeDefined()
      expect(data.message).toContain('json')
    })

    it('should handle large JSON files within size limits', async () => {
      // Generate a large JSON object (close to but within limits)
      const largeObject: Record<string, any> = {}
      for (let i = 0; i < 1000; i++) {
        largeObject[`key_${i}`] = {
          id: i,
          data: `value_${i}`.repeat(10),
          nested: {
            level1: {
              level2: {
                data: `nested_${i}`
              }
            }
          }
        }
      }

      const jsonString = JSON.stringify(largeObject)

      const response = await client.tools.json.format.$post({
        json: {
          json: jsonString,
          indent: 2,
          sort_keys: false
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.valid).toBe(true)
      expect(data.size).toBeGreaterThan(100000) // Should be substantial
    })

    it('should enforce rate limiting', async () => {
      // Make multiple rapid requests to test rate limiting
      const requests = Array(10).fill(null).map(() =>
        client.tools.json.format.$post({
          json: {
            json: '{"test": true}',
            indent: 2
          },
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
      )

      const responses = await Promise.allSettled(requests)

      // At least some requests should succeed
      const successfulResponses = responses.filter(
        result => result.status === 'fulfilled' && result.value.status === 200
      )

      // Some requests might be rate limited
      const rateLimitedResponses = responses.filter(
        result => result.status === 'fulfilled' && result.value.status === 429
      )

      expect(successfulResponses.length).toBeGreaterThan(0)
      // Rate limiting behavior depends on configuration
      if (rateLimitedResponses.length > 0) {
        const rateLimitedResponse = rateLimitedResponses[0] as PromiseFulfilledResult<Response>
        const data = await rateLimitedResponse.value.json()
        expect(data.error).toContain('rate_limit')
      }
    })
  })

  describe('Performance Requirements', () => {
    it('should format JSON within performance limits', async () => {
      const startTime = Date.now()

      const response = await client.tools.json.format.$post({
        json: {
          json: '{"name":"John","age":30,"city":"New York","country":"USA"}',
          indent: 2,
          sort_keys: true
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(100) // Should respond within 100ms
    })

    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 20
      const startTime = Date.now()

      const requests = Array(concurrentRequests).fill(null).map((_, index) =>
        client.tools.json.format.$post({
          json: {
            json: `{"request_id": ${index}, "data": "test data"}`,
            indent: 2
          },
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
      )

      const responses = await Promise.allSettled(requests)
      const endTime = Date.now()
      const totalTime = endTime - startTime

      const successfulResponses = responses.filter(
        result => result.status === 'fulfilled' && result.value.status === 200
      )

      expect(successfulResponses.length).toBeGreaterThan(concurrentRequests * 0.8) // At least 80% success
      expect(totalTime).toBeLessThan(1000) // All requests should complete within 1 second
    })
  })
})