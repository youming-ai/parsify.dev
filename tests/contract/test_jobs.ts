import { describe, it, expect, beforeAll } from 'vitest'
import { app } from '../../apps/api/src/index'

describe('POST /api/v1/jobs', () => {
  let testEnv: any

  beforeAll(() => {
    testEnv = {
      ENVIRONMENT: 'test',
    }
  })

  it('should create a new job for JSON formatting', async () => {
    const jobData = {
      tool_id: 'json-format',
      input_data: {
        json: '{"name":"John","age":30}',
        indent: 2,
        sort_keys: true
      }
    }

    const res = await app.request('/api/v1/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData)
    }, testEnv)

    expect(res.status).toBe(201)

    const data = await res.json()
    expect(data).toHaveProperty('id')
    expect(data).toHaveProperty('status', 'pending')
    expect(data).toHaveProperty('tool_id', 'json-format')
    expect(data).toHaveProperty('input_data')
    expect(data).toHaveProperty('created_at')
    expect(data).toHaveProperty('progress', 0)
  })

  it('should create a job for code execution', async () => {
    const jobData = {
      tool_id: 'code-execute',
      input_data: {
        code: 'console.log("Hello, World!");',
        language: 'javascript',
        timeout: 5000
      }
    }

    const res = await app.request('/api/v1/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData)
    }, testEnv)

    expect(res.status).toBe(201)

    const data = await res.json()
    expect(data).toHaveProperty('id')
    expect(data).toHaveProperty('status', 'pending')
    expect(data).toHaveProperty('tool_id', 'code-execute')
    expect(data.input_data).toHaveProperty('code')
    expect(data.input_data).toHaveProperty('language')
  })

  it('should validate required parameters', async () => {
    const res = await app.request('/api/v1/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Missing required 'tool_id' parameter
        input_data: { test: true }
      })
    }, testEnv)

    expect(res.status).toBe(400)

    const data = await res.json()
    expect(data).toHaveProperty('error')
    expect(data.error).toContain('tool_id')
  })

  it('should validate tool_id exists', async () => {
    const jobData = {
      tool_id: 'invalid-tool',
      input_data: { test: true }
    }

    const res = await app.request('/api/v1/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData)
    }, testEnv)

    expect(res.status).toBe(400)

    const data = await res.json()
    expect(data).toHaveProperty('error')
    expect(data.error).toContain('Invalid tool_id')
  })

  it('should handle job with file input reference', async () => {
    const jobData = {
      tool_id: 'json-format',
      input_ref: 'uuid-string-for-uploaded-file',
      input_data: {
        indent: 2
      }
    }

    const res = await app.request('/api/v1/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData)
    }, testEnv)

    expect(res.status).toBe(201)

    const data = await res.json()
    expect(data).toHaveProperty('input_ref', 'uuid-string-for-uploaded-file')
    expect(data).toHaveProperty('input_data')
  })

  it('should enforce job creation limits', async () => {
    // Create multiple jobs rapidly to test rate limiting
    const jobData = {
      tool_id: 'json-format',
      input_data: {
        json: '{"test": true}',
        indent: 2
      }
    }

    const requests = Array.from({ length: 10 }, () =>
      app.request('/api/v1/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData)
      }, testEnv)
    )

    const responses = await Promise.allSettled(requests)

    // At least some requests should succeed
    const successfulResponses = responses.filter(
      (result): result is PromiseFulfilledResult<Response> =>
        result.status === 'fulfilled' && result.value.status === 201
    )

    expect(successfulResponses.length).toBeGreaterThan(0)

    // Some might be rate limited
    const rateLimitedResponses = responses.filter(
      (result): result is PromiseFulfilledResult<Response> =>
        result.status === 'fulfilled' && result.value.status === 429
    )

    if (rateLimitedResponses.length > 0) {
      const rateLimitedResponse = rateLimitedResponses[0].value
      expect(rateLimitedResponse.headers.get('retry-after')).toBeTruthy()
    }
  })

  it('should reject oversized input data', async () => {
    const largeInput = {
      tool_id: 'json-format',
      input_data: {
        json: 'x'.repeat(10 * 1024 * 1024), // 10MB string
        indent: 2
      }
    }

    const res = await app.request('/api/v1/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(largeInput)
    }, testEnv)

    expect(res.status).toBe(413)

    const data = await res.json()
    expect(data).toHaveProperty('error')
    expect(data.error).toContain('Input size exceeds limit')
  })

  it('should include job metadata in response', async () => {
    const jobData = {
      tool_id: 'json-validate',
      input_data: {
        json: '{"valid": true}',
        schema: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' }
          }
        }
      }
    }

    const res = await app.request('/api/v1/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData)
    }, testEnv)

    expect(res.status).toBe(201)

    const data = await res.json()
    expect(data).toHaveProperty('id')
    expect(data).toHaveProperty('status')
    expect(data).toHaveProperty('tool_id')
    expect(data).toHaveProperty('input_data')
    expect(data).toHaveProperty('progress')
    expect(data).toHaveProperty('created_at')
    expect(data).toHaveProperty('updated_at')
    expect(data).not.toHaveProperty('output_data') // Should not have output yet
    expect(data).not.toHaveProperty('completed_at')
  })
})