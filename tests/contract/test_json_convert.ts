import { describe, it, expect, beforeAll } from 'vitest'
import { app } from '../../apps/api/src/index'

describe('POST /api/v1/tools/json/convert', () => {
  let testEnv: any

  beforeAll(() => {
    testEnv = {
      ENVIRONMENT: 'test',
    }
  })

  it('should convert JSON to CSV format', async () => {
    const inputJson = [
      { name: 'John', age: 30, city: 'New York' },
      { name: 'Jane', age: 25, city: 'San Francisco' }
    ]

    const res = await app.request('/api/v1/tools/json/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      name: 'json_convert_to_csv',
      body: JSON.stringify({
        json: JSON.stringify(inputJson),
        target_format: 'csv'
      })
    }, testEnv)

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('converted')
    expect(data).toHaveProperty('format', 'csv')
    expect(data.converted).toContain('name,age,city')
    expect(data.converted).toContain('John,30,New York')
    expect(data.converted).toContain('Jane,25,San Francisco')
  })

  it('should convert JSON to XML format', async () => {
    const inputJson = {
      user: {
        name: 'John',
        age: 30,
        active: true
      }
    }

    const res = await app.request('/api/v1/tools/json/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: JSON.stringify(inputJson),
        target_format: 'xml'
      })
    }, testEnv)

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('converted')
    expect(data).toHaveProperty('format', 'xml')
    expect(data.converted).toContain('<user>')
    expect(data.converted).toContain('<name>John</name>')
    expect(data.converted).toContain('<age>30</age>')
    expect(data.converted).toContain('</user>')
  })

  it('should handle array JSON to CSV conversion', async () => {
    const inputJson = [
      { id: 1, product: 'Laptop', price: 999.99 },
      { id: 2, product: 'Mouse', price: 29.99 }
    ]

    const res = await app.request('/api/v1/tools/json/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: JSON.stringify(inputJson),
        target_format: 'csv'
      })
    }, testEnv)

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.converted).toContain('id,product,price')
    expect(data.converted).toContain('1,Laptop,999.99')
  })

  it('should validate required parameters', async () => {
    const res = await app.request('/api/v1/tools/json/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Missing required 'json' parameter
        target_format: 'csv'
      })
    }, testEnv)

    expect(res.status).toBe(400)

    const data = await res.json()
    expect(data).toHaveProperty('error')
  })

  it('should handle invalid JSON input', async () => {
    const invalidJson = '{"name":"John","age":30,' // Missing closing brace

    const res = await app.request('/api/v1/tools/json/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: invalidJson,
        target_format: 'csv'
      })
    }, testEnv)

    expect(res.status).toBe(400)

    const data = await res.json()
    expect(data).toHaveProperty('error')
    expect(data.error).toContain('Invalid JSON')
  })

  it('should reject unsupported target formats in MVP', async () => {
    const res = await app.request('/api/v1/tools/json/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: '{"test": true}',
        target_format: 'yaml' // Not supported in MVP
      })
    }, testEnv)

    expect(res.status).toBe(400)

    const data = await res.json()
    expect(data).toHaveProperty('error')
    expect(data.error).toContain('Unsupported format')
  })

  it('should handle nested JSON objects for CSV flattening', async () => {
    const nestedJson = {
      user: {
        name: 'John',
        contact: {
          email: 'john@example.com',
          phone: '555-1234'
        }
      },
      meta: {
        created: '2023-01-01'
      }
    }

    const res = await app.request('/api/v1/tools/json/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: JSON.stringify(nestedJson),
        target_format: 'csv',
        options: {
          flatten: true
        }
      })
    }, testEnv)

    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('converted')
    expect(data).toHaveProperty('format', 'csv')
    // Should handle flattening appropriately
  })
})