import { beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../apps/api/src/index'

describe('Test with app import', () => {
  let _testEnv: any

  beforeAll(() => {
    _testEnv = {
      ENVIRONMENT: 'test',
    }
  })

  it('should import app', () => {
    expect(app).toBeDefined()
  })
})
