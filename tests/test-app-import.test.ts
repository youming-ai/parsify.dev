import { describe, it, expect, beforeAll } from 'vitest'
import { app } from '../../apps/api/src/index'

describe('Test with app import', () => {
  let testEnv: any

  beforeAll(() => {
    testEnv = {
      ENVIRONMENT: 'test',
    }
  })

  it('should import app', () => {
    expect(app).toBeDefined()
  })
})
