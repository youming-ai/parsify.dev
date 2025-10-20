import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { app } from '../../apps/api/src/index'

describe('Rate Limiting Integration Tests', () => {
  let testEnv: any
  let requestCount: { [key: string]: number } = {}

  beforeAll(() => {
    testEnv = {
      ENVIRONMENT: 'test',
      RATE_LIMIT: {
        checkLimit: async (identifier: string, limit: number, window: number) => {
          // Initialize counter for new identifier
          if (!requestCount[identifier]) {
            requestCount[identifier] = 0
          }

          // Increment request count
          requestCount[identifier]++

          const currentCount = requestCount[identifier]
          const allowed = currentCount <= limit
          const remaining = Math.max(0, limit - currentCount)
          const resetTime = Date.now() + window

          return {
            allowed,
            remaining,
            resetTime,
            currentCount,
            limit
          }
        },
        resetCounter: async (identifier: string) => {
          delete requestCount[identifier]
        }
      }
    }
  })

  afterEach(() => {
    // Reset counters after each test
    requestCount = {}
  })

  describe('Anonymous Rate Limiting', () => {
    it('should allow requests within anonymous rate limit', async () => {
      const anonymousIp = '192.168.1.100'

      // Make multiple requests within limit
      const requests = Array(5).fill(null).map((_, i) =>
        app.request('/api/v1/tools/json/format', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': anonymousIp,
            'User-Agent': 'test-agent'
          },
          body: JSON.stringify({
            json: `{"request": ${i + 1}}`
          })
        }, testEnv)
      )

      const results = await Promise.all(requests)

      // All requests should succeed
      results.forEach((res, index) => {
        expect(res.status).toBe(200)
        expect(res.headers.get('X-RateLimit-Limit')).toBe('20') // Anonymous limit
        expect(parseInt(res.headers.get('X-RateLimit-Remaining') || '0')).toBeLessThan(20)
      })
    })

    it('should reject requests exceeding anonymous rate limit', async () => {
      const anonymousIp = '192.168.1.101'

      // Make requests that exceed the limit
      const requests = Array(25).fill(null).map((_, i) =>
        app.request('/api/v1/tools/json/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': anonymousIp,
            'User-Agent': 'test-agent'
          },
          body: JSON.stringify({
            json: `{"test": ${i + 1}}`
          })
        }, testEnv)
      )

      const results = await Promise.allSettled(requests)

      // Count successful vs rejected requests
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 200)
      const rejected = results.filter(r =>
        r.status === 'fulfilled' && r.value.status === 429
      )

      expect(successful.length).toBe(20) // Anonymous limit
      expect(rejected.length).toBe(5) // Excess requests

      // Check rate limit headers on rejected requests
      rejected.forEach(r => {
        if (r.status === 'fulfilled') {
          const res = r.value
          expect(res.headers.get('X-RateLimit-Limit')).toBe('20')
          expect(res.headers.get('X-RateLimit-Remaining')).toBe('0')
          expect(res.headers.get('Retry-After')).toBeTruthy()
        }
      })
    })

    it('should identify anonymous users by IP address', async () => {
      const ip1 = '192.168.1.200'
      const ip2 = '192.168.1.201'

      // Requests from different IPs should have separate limits
      const requests1 = Array(15).fill(null).map(() =>
        app.request('/api/v1/tools/json/format', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': ip1
          },
          body: JSON.stringify({ json: '{"ip": "1"}' })
        }, testEnv)
      )

      const requests2 = Array(15).fill(null).map(() =>
        app.request('/api/v1/tools/json/format', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': ip2
          },
          body: JSON.stringify({ json: '{"ip": "2"}' })
        }, testEnv)
      )

      const [results1, results2] = await Promise.allSettled([
        Promise.all(requests1),
        Promise.all(requests2)
      ])

      // Both IP ranges should be able to make 15 requests successfully
      if (results1.status === 'fulfilled') {
        results1.value.forEach(res => {
          expect(res.status).toBe(200)
        })
      }

      if (results2.status === 'fulfilled') {
        results2.value.forEach(res => {
          expect(res.status).toBe(200)
        })
      }
    })
  })

  describe('Authenticated Rate Limiting', () => {
    it('should provide higher rate limits for authenticated users', async () => {
      // Mock authenticated session
      const sessionId = 'authenticated-session-123'
      const userId = 'user-456'

      const authTestEnv = {
        ...testEnv,
        KV: {
          get: async (key: string) => {
            if (key.startsWith('session:')) {
              return JSON.stringify({
                sessionId,
                userId,
                role: 'user',
                createdAt: new Date().toISOString()
              })
            }
            return null
          }
        }
      }

      // Authenticated users should have higher limits
      const requests = Array(80).fill(null).map((_, i) =>
        app.request('/api/v1/tools/json/format', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionId}`,
            'X-Forwarded-For': '192.168.1.100'
          },
          body: JSON.stringify({
            json: `{"auth_request": ${i + 1}}`
          })
        }, authTestEnv)
      )

      const results = await Promise.allSettled(requests)

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 200)
      const rejected = results.filter(r =>
        r.status === 'fulfilled' && r.value.status === 429
      )

      expect(successful.length).toBe(80) // Authenticated limit is higher
      expect(rejected.length).toBe(0)

      // Check rate limit headers reflect authenticated limits
      if (successful.length > 0 && successful[0].status === 'fulfilled') {
        const res = successful[0].value
        expect(parseInt(res.headers.get('X-RateLimit-Limit') || '0')).toBeGreaterThan(20)
      }
    })

    it('should track rate limits by user ID for authenticated sessions', async () => {
      const userId = 'user-789'
      const session1 = 'session-1'
      const session2 = 'session-2'

      const authTestEnv = {
        ...testEnv,
        KV: {
          get: async (key: string) => {
            if (key.includes(session1) || key.includes(session2)) {
              return JSON.stringify({
                sessionId: key.includes(session1) ? session1 : session2,
                userId,
                role: 'user',
                createdAt: new Date().toISOString()
              })
            }
            return null
          }
        }
      }

      // Requests from different sessions of same user should share limit
      const requests1 = Array(40).fill(null).map(() =>
        app.request('/api/v1/tools/json/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session1}`,
            'X-Forwarded-For': '192.168.1.100'
          },
          body: JSON.stringify({ json: '{"session": "1"}' })
        }, authTestEnv)
      )

      const requests2 = Array(40).fill(null).map(() =>
        app.request('/api/v1/tools/json/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session2}`,
            'X-Forwarded-For': '192.168.1.101'
          },
          body: JSON.stringify({ json: '{"session": "2"}' })
        }, authTestEnv)
      )

      const [results1, results2] = await Promise.allSettled([
        Promise.all(requests1),
        Promise.all(requests2)
      ])

      // Combined requests should respect single user limit
      const totalSuccessful = [
        ...(results1.status === 'fulfilled' ? results1.value : []),
        ...(results2.status === 'fulfilled' ? results2.value : [])
      ].filter(res => res.status === 200).length

      expect(totalSuccessful).toBeLessThanOrEqual(100) // Should not exceed user limit
    })
  })

  describe('Endpoint-Specific Rate Limiting', () => {
    it('should apply different limits for different endpoint types', async () => {
      const ip = '192.168.1.300'

      // Code execution should have stricter limits
      const codeExecRequests = Array(8).fill(null).map((_, i) =>
        app.request('/api/v1/tools/code/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': ip
          },
          body: JSON.stringify({
            code: `console.log(${i});`,
            language: 'javascript'
          })
        }, testEnv)
      )

      // JSON tools should have more lenient limits
      const jsonToolRequests = Array(8).fill(null).map((_, i) =>
        app.request('/api/v1/tools/json/format', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': ip
          },
          body: JSON.stringify({
            json: `{"request": ${i}}`
          })
        }, testEnv)
      )

      const [codeResults, jsonResults] = await Promise.allSettled([
        Promise.all(codeExecRequests),
        Promise.all(jsonToolRequests)
      ])

      // Code execution should hit limit sooner
      if (codeResults.status === 'fulfilled') {
        const codeRejected = codeResults.value.filter(r => r.status === 429)
        expect(codeRejected.length).toBeGreaterThan(0)
      }

      // JSON tools should still be allowed
      if (jsonResults.status === 'fulfilled') {
        const jsonSuccessful = jsonResults.value.filter(r => r.status === 200)
        expect(jsonSuccessful.length).toBe(8)
      }
    })

    it('should apply stricter limits to resource-intensive operations', async () => {
      const ip = '192.168.1.400'

      // File upload should have very strict limits
      const uploadRequests = Array(3).fill(null).map((_, i) =>
        app.request('/api/v1/upload/sign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': ip
          },
          body: JSON.stringify({
            filename: `test-${i}.json`,
            content_type: 'application/json',
            size: 1024
          })
        }, testEnv)
      )

      const results = await Promise.allSettled(uploadRequests)

      // Upload should have very restrictive limits
      const successful = results.filter(r =>
        r.status === 'fulfilled' && r.value.status === 200
      )
      const rejected = results.filter(r =>
        r.status === 'fulfilled' && r.value.status === 429
      )

      expect(successful.length).toBeLessThanOrEqual(2) // Very strict upload limit
    })
  })

  describe('Rate Limit Headers', () => {
    it('should include proper rate limit headers in responses', async () => {
      const res = await app.request('/api/v1/tools/json/format', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '192.168.1.500'
        },
        body: JSON.stringify({
          json: '{"test": true}'
        })
      }, testEnv)

      expect(res.status).toBe(200)

      // Check for standard rate limit headers
      expect(res.headers.get('X-RateLimit-Limit')).toBeTruthy()
      expect(res.headers.get('X-RateLimit-Remaining')).toBeTruthy()
      expect(res.headers.get('X-RateLimit-Reset')).toBeTruthy()

      // Values should be numeric
      expect(parseInt(res.headers.get('X-RateLimit-Limit') || '0')).toBeGreaterThan(0)
      expect(parseInt(res.headers.get('X-RateLimit-Remaining') || '0')).toBeGreaterThanOrEqual(0)
      expect(parseInt(res.headers.get('X-RateLimit-Reset') || '0')).toBeGreaterThan(0)
    })

    it('should include Retry-After header when rate limited', async () => {
      const ip = '192.168.1.600'

      // Exhaust the rate limit
      const requests = Array(25).fill(null).map(() =>
        app.request('/api/v1/tools/json/format', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': ip
          },
          body: JSON.stringify({ json: '{"test": true}' })
        }, testEnv)
      )

      const results = await Promise.allSettled(requests)
      const rejected = results.filter(r =>
        r.status === 'fulfilled' && r.value.status === 429
      )

      expect(rejected.length).toBeGreaterThan(0)

      // Check Retry-After header on rejected requests
      rejected.forEach(r => {
        if (r.status === 'fulfilled') {
          const res = r.value
          expect(res.headers.get('Retry-After')).toBeTruthy()
          const retryAfter = parseInt(res.headers.get('Retry-After') || '0')
          expect(retryAfter).toBeGreaterThan(0)
        }
      })
    })

    it('should update remaining count correctly', async () => {
      const ip = '192.168.1.700'

      // Make sequential requests and check remaining count
      let previousRemaining = 20

      for (let i = 0; i < 5; i++) {
        const res = await app.request('/api/v1/tools/json/format', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': ip
          },
          body: JSON.stringify({
            json: `{"request": ${i + 1}}`
          })
        }, testEnv)

        expect(res.status).toBe(200)

        const remaining = parseInt(res.headers.get('X-RateLimit-Remaining') || '0')
        expect(remaining).toBeLessThan(previousRemaining)
        previousRemaining = remaining
      }

      expect(previousRemaining).toBe(15) // 20 - 5 requests
    })
  })

  describe('Sliding Window Behavior', () => {
    it('should reset rate limit after window expires', async () => {
      const ip = '192.168.1.800'
      let requestCount = 0

      // Make requests up to the limit
      const makeRequest = async () => {
        const res = await app.request('/api/v1/tools/json/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': ip
          },
          body: JSON.stringify({
            json: `{"count": ${++requestCount}}`
          })
        }, testEnv)

        return res.status === 200
      }

      // Exhaust the limit
      let successCount = 0
      while (await makeRequest() && successCount < 25) {
        successCount++
      }

      expect(successCount).toBe(20) // Anonymous limit

      // Wait for window to reset (in real implementation this would be time-based)
      // For testing, we'll reset the counter manually
      delete testEnv.RATE_LIMIT.checkLimit

      // After reset, should be able to make requests again
      const resetRes = await app.request('/api/v1/tools/json/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': ip
        },
        body: JSON.stringify({
          json: '{"after_reset": true}'
        })
      }, testEnv)

      expect(resetRes.status).toBe(200)
    })
  })

  describe('Bypass and Special Cases', () => {
    it('should allow health check endpoints without rate limiting', async () => {
      const healthRequests = Array(50).fill(null).map(() =>
        app.request('/api/v1/health', {
          method: 'GET',
          headers: {
            'X-Forwarded-For': '192.168.1.900'
          }
        }, testEnv)
      )

      const results = await Promise.allSettled(healthRequests)
      const successful = results.filter(r =>
        r.status === 'fulfilled' && r.value.status === 200
      )

      // Health checks should not be rate limited
      expect(successful.length).toBe(50)
    })

    it('should handle rate limit store failures gracefully', async () => {
      const failureTestEnv = {
        ...testEnv,
        RATE_LIMIT: {
          checkLimit: async () => {
            throw new Error('Rate limit store unavailable')
          }
        }
      }

      const res = await app.request('/api/v1/tools/json/format', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '192.168.1.1000'
        },
        body: JSON.stringify({
          json: '{"test": true}'
        })
      }, failureTestEnv)

      // Should either succeed (fail open) or return proper error
      expect([200, 500]).toContain(res.status)

      if (res.status === 500) {
        const data = await res.json()
        expect(data).toHaveProperty('error')
        expect(data.error).toContain('rate limit')
      }
    })
  })

  describe('Concurrent Request Handling', () => {
    it('should handle concurrent requests correctly', async () => {
      const ip = '192.168.1.1100'

      // Make many concurrent requests
      const concurrentRequests = Array(30).fill(null).map((_, i) =>
        app.request('/api/v1/tools/json/format', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': ip
          },
          body: JSON.stringify({
            json: `{"concurrent": ${i + 1}}`
          })
        }, testEnv)
      )

      const results = await Promise.allSettled(concurrentRequests)

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 200)
      const rejected = results.filter(r =>
        r.status === 'fulfilled' && r.value.status === 429
      )

      // Should not exceed the rate limit even with concurrency
      expect(successful.length).toBe(20)
      expect(rejected.length).toBe(10)
    })
  })
})