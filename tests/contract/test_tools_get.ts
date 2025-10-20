import { describe, it, expect, beforeAll } from 'vitest'
import { app } from '../../apps/api/src/index'

describe('GET /api/v1/tools', () => {
  let testEnv: any

  beforeAll(() => {
    testEnv = {
      ENVIRONMENT: 'test',
    }
  })

  it('should return 200 with tools list', async () => {
    const res = await app.request('/api/v1/tools', {
      method: 'GET',
    }, testEnv)

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('tools')
    expect(Array.isArray(data.tools)).toBe(true)

    // Should contain at least JSON tools for MVP
    const jsonTools = data.tools.filter((tool: any) => tool.category === 'json')
    expect(jsonTools.length).toBeGreaterThan(0)
  })

  it('should filter tools by category', async () => {
    const res = await app.request('/api/v1/tools?category=json', {
      method: 'GET',
    }, testEnv)

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(Array.isArray(data.tools)).toBe(true)

    // All returned tools should be JSON category
    data.tools.forEach((tool: any) => {
      expect(tool.category).toBe('json')
    })
  })

  it('should return only enabled tools by default', async () => {
    const res = await app.request('/api/v1/tools?enabled_only=true', {
      method: 'GET',
    }, testEnv)

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(Array.isArray(data.tools)).toBe(true)

    // All returned tools should be enabled
    data.tools.forEach((tool: any) => {
      expect(tool.enabled).toBe(true)
    })
  })

  it('should handle invalid category gracefully', async () => {
    const res = await app.request('/api/v1/tools?category=invalid', {
      method: 'GET',
    }, testEnv)

    expect(res.status).toBe(400)

    const data = await res.json()
    expect(data).toHaveProperty('error')
  })
})