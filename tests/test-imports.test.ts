import { beforeAll, describe, expect, it } from 'vitest'

describe('Test with imports', () => {
  let testEnv: any

  beforeAll(() => {
    testEnv = {
      ENVIRONMENT: 'test',
    }
  })

  it('should have test env', () => {
    expect(testEnv.ENVIRONMENT).toBe('test')
  })
})
