import { beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../apps/api/src/index'

describe('POST /api/v1/tools/json/validate', () => {
  let testEnv: any

  beforeAll(() => {
    testEnv = {
      ENVIRONMENT: 'test',
    }
  })

  it('should validate valid JSON without schema', async () => {
    const inputJson = '{"name":"John","age":30}'

    const res = await app.request(
      '/api/v1/tools/json/validate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: inputJson,
        }),
      },
      testEnv
    )

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('valid', true)
    expect(data).toHaveProperty('errors', [])
  })

  it('should validate JSON against schema', async () => {
    const inputJson = '{"name":"John","age":30}'
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
      required: ['name', 'age'],
    }

    const res = await app.request(
      '/api/v1/tools/json/validate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: inputJson,
          schema: schema,
        }),
      },
      testEnv
    )

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('valid', true)
    expect(data.errors).toEqual([])
  })

  it('should detect validation errors', async () => {
    const inputJson = '{"name":"John"}' // Missing required 'age' field
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
      required: ['name', 'age'],
    }

    const res = await app.request(
      '/api/v1/tools/json/validate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: inputJson,
          schema: schema,
        }),
      },
      testEnv
    )

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('valid', false)
    expect(data.errors).toBeDefined()
    expect(Array.isArray(data.errors)).toBe(true)
    expect(data.errors.length).toBeGreaterThan(0)
  })

  it('should handle invalid JSON syntax', async () => {
    const invalidJson = '{"name":"John","age":30,' // Missing closing brace

    const res = await app.request(
      '/api/v1/tools/json/validate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: invalidJson,
        }),
      },
      testEnv
    )

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('valid', false)
    expect(data.errors).toBeDefined()
    expect(data.errors.length).toBeGreaterThan(0)
  })

  it('should validate required parameters', async () => {
    const res = await app.request(
      '/api/v1/tools/json/validate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Missing required 'json' parameter
        }),
      },
      testEnv
    )

    expect(res.status).toBe(400)

    const data = await res.json()
    expect(data).toHaveProperty('error')
  })

  it('should handle nested object validation', async () => {
    const inputJson = '{"user":{"name":"John","address":{"city":"NY"}}}'
    const schema = {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                city: { type: 'string' },
                zip: { type: 'string' },
              },
              required: ['city'],
            },
          },
          required: ['name', 'address'],
        },
      },
      required: ['user'],
    }

    const res = await app.request(
      '/api/v1/tools/json/validate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: inputJson,
          schema: schema,
        }),
      },
      testEnv
    )

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.valid).toBe(true)
    expect(data.errors).toEqual([])
  })
})
