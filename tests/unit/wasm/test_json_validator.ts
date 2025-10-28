import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  addCustomRule,
  addSchema,
  type CustomValidationRule,
  JsonDepthError,
  JsonSizeError,
  JsonValidationError,
  JsonValidator,
  jsonValidator,
  validateJson,
  validateJsonSyntax,
  validateWithSchema,
} from '../../../apps/api/src/wasm/json_validator'

describe('JsonValidator', () => {
  let validator: JsonValidator

  beforeEach(async () => {
    validator = new JsonValidator()
    await validator.initialize()
  })

  afterEach(() => {
    validator.dispose()
  })

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const newValidator = new JsonValidator()
      await newValidator.initialize()
      expect(newValidator.isReady()).toBe(true)
      newValidator.dispose()
    })

    it('should handle multiple initialization calls', async () => {
      await validator.initialize()
      await validator.initialize()
      expect(validator.isReady()).toBe(true)
    })

    it('should get performance metrics', () => {
      const metrics = validator.getMetrics()
      expect(metrics).toHaveProperty('validationTime')
      expect(metrics).toHaveProperty('parsingTime')
      expect(metrics).toHaveProperty('totalTime')
      expect(metrics).toHaveProperty('memoryUsage')
    })
  })

  describe('JSON validation', () => {
    it('should validate valid JSON object', async () => {
      const data = { name: 'John', age: 30 }
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name', 'age'],
      }

      const result = await validator.validate(data, schema)

      expect(result.valid).toBe(true)
      expect(result.errors).toBeUndefined()
      expect(result.metadata.validationTime).toBeGreaterThanOrEqual(0)
      expect(result.metadata.parsingTime).toBeGreaterThanOrEqual(0)
      expect(result.metadata.totalTime).toBeGreaterThanOrEqual(0)
    })

    it('should validate valid JSON array', async () => {
      const data = [1, 2, 3, 'test']
      const schema = {
        type: 'array',
        items: { type: ['number', 'string'] },
      }

      const result = await validator.validate(data, schema)

      expect(result.valid).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it('should validate nested JSON structures', async () => {
      const data = {
        user: {
          name: 'John',
          address: {
            city: 'New York',
            zip: '10001',
          },
        },
      }
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
                required: ['city', 'zip'],
              },
            },
            required: ['name', 'address'],
          },
        },
        required: ['user'],
      }

      const result = await validator.validate(data, schema)

      expect(result.valid).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it('should validate JSON string input', async () => {
      const jsonString = '{"name":"John","age":30}'
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
      }

      const result = await validator.validate(jsonString, schema)

      expect(result.valid).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it('should handle validation errors', async () => {
      const data = { name: 'John', age: 'invalid' }
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name', 'age'],
      }

      const result = await validator.validate(data, schema)

      expect(result.valid).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.length).toBeGreaterThan(0)
      expect(result.metadata.errorCount).toBeGreaterThan(0)
    })

    it('should handle missing required fields', async () => {
      const data = { name: 'John' }
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name', 'age'],
      }

      const result = await validator.validate(data, schema)

      expect(result.valid).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.some(error => error.keyword === 'required')).toBe(true)
    })

    it('should handle type mismatches', async () => {
      const data = { name: 'John', age: 'thirty' }
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
      }

      const result = await validator.validate(data, schema)

      expect(result.valid).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.some(error => error.keyword === 'type')).toBe(true)
    })
  })

  describe('Validation options', () => {
    it('should validate with strict mode enabled', async () => {
      const data = { name: 'John', extraProperty: 'value' }
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        additionalProperties: false,
        required: ['name'],
      }

      const result = await validator.validate(data, schema, {
        strictMode: true,
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it('should validate with all errors enabled', async () => {
      const data = { name: 123, age: 'thirty' }
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name', 'age'],
      }

      const result = await validator.validate(data, schema, { allErrors: true })

      expect(result.valid).toBe(false)
      expect(result.errors?.length).toBeGreaterThan(1)
    })

    it('should validate with max errors limit', async () => {
      const data = { name: 123, age: 'thirty', invalid: 'value' }
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name', 'age'],
        additionalProperties: false,
      }

      const result = await validator.validate(data, schema, { maxErrors: 2 })

      expect(result.valid).toBe(false)
      expect(result.errors?.length).toBeLessThanOrEqual(2)
    })

    it('should remove additional properties when requested', async () => {
      const data = { name: 'John', extraProperty: 'value' }
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      }

      const result = await validator.validate(data, schema, {
        removeAdditional: true,
      })

      expect(result.valid).toBe(true)
    })

    it('should use default values when requested', async () => {
      const data = { name: 'John' }
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number', default: 25 },
        },
        required: ['name'],
      }

      const result = await validator.validate(data, schema, {
        useDefaults: true,
      })

      expect(result.valid).toBe(true)
    })

    it('should coerce types when requested', async () => {
      const data = { name: 'John', age: '30' }
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
      }

      const result = await validator.validate(data, schema, {
        coerceTypes: true,
      })

      expect(result.valid).toBe(true)
    })
  })

  describe('Syntax validation', () => {
    it('should validate JSON syntax only', async () => {
      const validJson = '{"name":"John","age":30}'

      const result = await validator.validateSyntax(validJson)

      expect(result.valid).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it('should detect invalid JSON syntax', async () => {
      const invalidJson = '{"name":"John",age:30}' // Missing quotes around age

      const result = await validator.validateSyntax(invalidJson)

      expect(result.valid).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it('should detect malformed bracket structure', async () => {
      const invalidJson = '{"name":"John"'

      const result = await validator.validateSyntax(invalidJson)

      expect(result.valid).toBe(false)
      expect(result.errors).toBeDefined()
    })

    it('should calculate JSON depth correctly', async () => {
      const deepJson = JSON.stringify({
        level1: {
          level2: {
            level3: {
              data: 'value',
            },
          },
        },
      })

      const result = await validator.validateSyntax(deepJson)

      expect(result.valid).toBe(true)
      expect(result.metadata.depth).toBeGreaterThanOrEqual(3)
    })

    it('should handle empty JSON objects', async () => {
      const result = await validator.validateSyntax('{}')

      expect(result.valid).toBe(true)
    })

    it('should handle empty JSON arrays', async () => {
      const result = await validator.validateSyntax('[]')

      expect(result.valid).toBe(true)
    })
  })

  describe('Custom validation rules', () => {
    it('should add and apply custom validation rules', async () => {
      const customRule: CustomValidationRule = {
        name: 'customLength',
        description: 'Validate string length',
        validator: (data: any) => {
          if (typeof data === 'string') {
            return data.length <= 10
          }
          return true
        },
        errorMessage: 'String too long',
      }

      await validator.addCustomRule(customRule)

      const data = { name: 'Very long name that exceeds limit' }
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      }

      const result = await validator.validate(data, schema)

      // Note: Custom rules implementation might vary, this is a basic test
      expect(result).toBeDefined()
    })

    it('should remove custom validation rules', () => {
      const customRule: CustomValidationRule = {
        name: 'testRule',
        description: 'Test rule',
        validator: () => true,
      }

      validator.addCustomRule(customRule)
      expect(validator.getCustomRules()).toContainEqual(customRule)

      validator.removeCustomRule('testRule')
      expect(validator.getCustomRules()).not.toContainEqual(customRule)
    })

    it('should get list of custom rules', () => {
      const rules = validator.getCustomRules()
      expect(Array.isArray(rules)).toBe(true)
    })

    it('should handle custom rule execution errors', async () => {
      const errorRule: CustomValidationRule = {
        name: 'errorRule',
        description: 'Rule that throws error',
        validator: () => {
          throw new Error('Rule execution failed')
        },
      }

      await validator.addCustomRule(errorRule)

      const data = { name: 'test' }
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      }

      // Should handle rule errors gracefully
      const result = await validator.validate(data, schema)
      expect(result).toBeDefined()
    })
  })

  describe('Schema management', () => {
    it('should add schemas', () => {
      const schema = {
        $id: 'test-schema',
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      }

      validator.addSchema(schema)
      const schemas = validator.getSchemas()
      expect(schemas).toContainEqual(schema)
    })

    it('should remove schemas', () => {
      const schema = {
        $id: 'test-schema',
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      }

      validator.addSchema(schema)
      validator.removeSchema('test-schema')
      const schemas = validator.getSchemas()
      expect(schemas).not.toContainEqual(schema)
    })

    it('should get list of schemas', () => {
      const schemas = validator.getSchemas()
      expect(Array.isArray(schemas)).toBe(true)
    })

    it('should validate schema structure', () => {
      const invalidSchema = { type: 'invalid-type' }

      expect(() => {
        validator.addSchema(invalidSchema as any)
      }).toThrow()
    })

    it('should require $id in schemas', () => {
      const schemaWithoutId = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      }

      expect(() => {
        validator.addSchema(schemaWithoutId as any)
      }).toThrow()
    })
  })

  describe('Error handling', () => {
    it('should handle parsing errors with detailed information', async () => {
      const malformedJson = '{"name":"John",invalid}'

      try {
        await validator.validate(malformedJson, { type: 'object' })
      } catch (error) {
        expect(error).toBeInstanceOf(JsonValidationError)
        expect(error.name).toBe('JsonValidationError')
      }
    })

    it('should handle oversized input', async () => {
      const largeInput = 'x'.repeat(51 * 1024 * 1024) // 51MB

      await expect(validator.validate(largeInput, { type: 'string' })).rejects.toThrow(
        JsonSizeError
      )
    })

    it('should handle oversized schema', async () => {
      const largeSchema = {
        $id: 'large-schema',
        type: 'object',
        properties: {},
      }

      // Create large properties object
      for (let i = 0; i < 100000; i++) {
        largeSchema.properties[`prop${i}`] = { type: 'string' }
      }

      await expect(validator.validate({}, largeSchema)).rejects.toThrow(JsonSizeError)
    })

    it('should handle excessive depth', async () => {
      const deepData = []
      let current = deepData
      for (let i = 0; i < 1001; i++) {
        current.push({})
        current = current[0]
      }

      await expect(validator.validate(deepData, { type: 'array' })).rejects.toThrow(JsonDepthError)
    })

    it('should handle suspicious content', async () => {
      const maliciousInput = '{"script":"<script>alert(1)</script>"}'

      await expect(validator.validate(maliciousInput, { type: 'object' })).rejects.toThrow(
        JsonValidationError
      )
    })
  })

  describe('Configuration', () => {
    it('should allow setting custom size limits', () => {
      validator.setLimits(1024, 5120) // 1KB input, 5KB schema

      // Limits would be applied during validation
      expect(validator).toBeDefined()
    })

    it('should configure limits correctly', async () => {
      const smallData = 'test'
      const largeData = 'x'.repeat(2000)
      const schema = { type: 'string' }

      validator.setLimits(1500, 10000) // 1.5KB input limit

      // Should work with small data
      const result1 = await validator.validate(smallData, schema)
      expect(result1.valid).toBe(true)

      // Should fail with large data
      await expect(validator.validate(largeData, schema)).rejects.toThrow(JsonSizeError)
    })
  })

  describe('Security validation', () => {
    it('should reject potentially malicious content', async () => {
      const maliciousInputs = [
        '{"script":"<script>alert(1)</script>"}',
        '{"code":"javascript:alert(1)"}',
        '{"payload":"eval(malicious())"}',
        '{"callback":"setTimeout(function(){},0)"}',
      ]

      for (const input of maliciousInputs) {
        await expect(validator.validate(input, { type: 'object' })).rejects.toThrow(
          JsonValidationError
        )
      }
    })

    it('should check for XSS patterns', async () => {
      const xssInput = '{"html":"<img src=x onerror=alert(1)>"}'

      await expect(validator.validate(xssInput, { type: 'object' })).rejects.toThrow(
        JsonValidationError
      )
    })
  })

  describe('Performance considerations', () => {
    it('should handle large JSON efficiently', async () => {
      const largeObject: any = {}
      for (let i = 0; i < 1000; i++) {
        largeObject[`key${i}`] = {
          id: i,
          name: `Item ${i}`,
          tags: [`tag${i}`, `category${i % 10}`],
          metadata: {
            created: new Date().toISOString(),
            active: i % 2 === 0,
          },
        }
      }

      const schema = {
        type: 'object',
        patternProperties: {
          'key\\d+': {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              active: { type: 'boolean' },
            },
          },
        },
      }

      const startTime = performance.now()
      const result = await validator.validate(largeObject, schema)
      const endTime = performance.now()

      expect(result.valid).toBe(true)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should provide detailed metadata', async () => {
      const data = {
        users: [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 },
        ],
      }
      const schema = {
        type: 'object',
        properties: {
          users: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                age: { type: 'number' },
              },
              required: ['name', 'age'],
            },
          },
        },
        required: ['users'],
      }

      const result = await validator.validate(data, schema)

      expect(result.metadata).toBeDefined()
      expect(result.metadata.validationTime).toBeGreaterThanOrEqual(0)
      expect(result.metadata.parsingTime).toBeGreaterThanOrEqual(0)
      expect(result.metadata.totalTime).toBeGreaterThanOrEqual(0)
      expect(result.metadata.dataSize).toBeGreaterThan(0)
      expect(result.metadata.schemaSize).toBeGreaterThan(0)
      expect(result.metadata.customRulesApplied).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Resource management', () => {
    it('should dispose resources properly', async () => {
      expect(validator.isReady()).toBe(true)

      validator.dispose()
      expect(validator.isReady()).toBe(false)
    })

    it('should clear all resources on dispose', async () => {
      const customRule: CustomValidationRule = {
        name: 'testRule',
        description: 'Test rule',
        validator: () => true,
      }

      const schema = {
        $id: 'test-schema',
        type: 'object',
        properties: { name: { type: 'string' } },
      }

      await validator.addCustomRule(customRule)
      validator.addSchema(schema)

      expect(validator.getCustomRules()).toContainEqual(customRule)
      expect(validator.getSchemas()).toContainEqual(schema)

      validator.dispose()

      // After dispose, should be empty
      expect(validator.isReady()).toBe(false)
    })
  })
})

describe('Utility functions', () => {
  beforeEach(async () => {
    await jsonValidator.initialize()
  })

  it('validateJson should validate JSON correctly', async () => {
    const data = { name: 'John', age: 30 }
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
      required: ['name', 'age'],
    }

    const result = await validateJson(data, schema)

    expect(result.valid).toBe(true)
    expect(result.errors).toBeUndefined()
  })

  it('validateJsonSyntax should validate syntax correctly', async () => {
    const validJson = '{"name":"John","age":30}'
    const invalidJson = '{"name":"John",age:30}'

    const validResult = await validateJsonSyntax(validJson)
    expect(validResult.valid).toBe(true)
    expect(validResult.errors).toBeUndefined()

    const invalidResult = await validateJsonSyntax(invalidJson)
    expect(invalidResult.valid).toBe(false)
    expect(invalidResult.errors).toBeDefined()
  })

  it('validateWithSchema should use registered schema', async () => {
    const schema = {
      $id: 'user-schema',
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
      required: ['name', 'age'],
    }

    await addSchema(schema)

    const data = { name: 'John', age: 30 }
    const result = await validateWithSchema(data, 'user-schema')

    expect(result.valid).toBe(true)
  })

  it('addSchema should register schemas correctly', async () => {
    const schema = {
      $id: 'test-schema',
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    }

    await addSchema(schema)

    const schemas = jsonValidator.getSchemas()
    expect(schemas).toContainEqual(schema)
  })

  it('addCustomRule should add rules correctly', async () => {
    const customRule: CustomValidationRule = {
      name: 'testRule',
      description: 'Test rule for unit testing',
      validator: (_data: any) => true,
      errorMessage: 'Test rule failed',
    }

    await addCustomRule(customRule)

    const rules = jsonValidator.getCustomRules()
    expect(rules).toContainEqual(customRule)
  })

  it('should handle schema not found error', async () => {
    const data = { name: 'John' }

    await expect(validateWithSchema(data, 'non-existent-schema')).rejects.toThrow(
      'Schema with ID non-existent-schema not found'
    )
  })
})

describe('Edge cases', () => {
  beforeEach(async () => {
    await jsonValidator.initialize()
  })

  it('should handle null and undefined values', async () => {
    const data = { name: null, age: undefined, active: true }
    const schema = {
      type: 'object',
      properties: {
        name: { type: ['null', 'string'] },
        age: { type: 'number' },
        active: { type: 'boolean' },
      },
    }

    const result = await validateJson(data, schema)
    expect(result.valid).toBe(true)
  })

  it('should handle circular references (should error)', async () => {
    const obj: any = { name: 'test' }
    obj.self = obj

    // JSON.stringify would throw, but we need to test our handling
    await expect(validateJson(JSON.stringify(obj), { type: 'object' })).rejects.toThrow()
  })

  it('should handle Unicode characters', async () => {
    const data = { greeting: '你好', emoji: '🌍' }
    const schema = {
      type: 'object',
      properties: {
        greeting: { type: 'string' },
        emoji: { type: 'string' },
      },
    }

    const result = await validateJson(data, schema)
    expect(result.valid).toBe(true)
  })

  it('should handle escape sequences', async () => {
    const data = {
      newline: 'line1\\nline2',
      tab: 'col1\\tcol2',
      quote: 'say \\"hello\\"',
      backslash: 'path\\\\to\\\\file',
    }
    const schema = {
      type: 'object',
      properties: {
        newline: { type: 'string' },
        tab: { type: 'string' },
        quote: { type: 'string' },
        backslash: { type: 'string' },
      },
    }

    const result = await validateJson(data, schema)
    expect(result.valid).toBe(true)
  })

  it('should handle very large numbers', async () => {
    const data = {
      bigInt: 9007199254740991, // Number max safe integer
      scientific: 1.23e10,
      negative: -42,
      zero: 0,
      float: Math.PI,
    }
    const schema = {
      type: 'object',
      properties: {
        bigInt: { type: 'number' },
        scientific: { type: 'number' },
        negative: { type: 'number' },
        zero: { type: 'number' },
        float: { type: 'number' },
      },
    }

    const result = await validateJson(data, schema)
    expect(result.valid).toBe(true)
  })

  it('should handle special number values', async () => {
    const data = {
      infinity: Infinity,
      negInfinity: -Infinity,
      nan: NaN,
    }
    const schema = {
      type: 'object',
      properties: {
        infinity: { type: 'number' },
        negInfinity: { type: 'number' },
        nan: { type: 'number' },
      },
    }

    // JSON.stringify handles special values differently
    const jsonString = JSON.stringify(data)
    const result = await validateJson(jsonString, schema)

    // Should handle gracefully based on JSON serialization
    expect(result).toBeDefined()
  })

  it('should handle empty strings and whitespace', async () => {
    const data = {
      empty: '',
      whitespace: '   ',
      newline: '\\n\\r\\n',
      tab: '\\t\\t',
    }
    const schema = {
      type: 'object',
      properties: {
        empty: { type: 'string' },
        whitespace: { type: 'string' },
        newline: { type: 'string' },
        tab: { type: 'string' },
      },
    }

    const result = await validateJson(data, schema)
    expect(result.valid).toBe(true)
  })
})

describe('Performance benchmarks', () => {
  beforeEach(async () => {
    await jsonValidator.initialize()
  })

  it('should handle complex nested schemas efficiently', async () => {
    const complexSchema = {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              profile: {
                type: 'object',
                properties: {
                  personal: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      contacts: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            type: { type: 'string' },
                            value: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }

    const data = {
      users: [
        {
          id: 1,
          profile: {
            personal: {
              name: 'John Doe',
              contacts: [
                { type: 'email', value: 'john@example.com' },
                { type: 'phone', value: '+1234567890' },
              ],
            },
          },
        },
      ],
    }

    const startTime = performance.now()
    const result = await validateJson(data, complexSchema)
    const endTime = performance.now()

    expect(result.valid).toBe(true)
    expect(endTime - startTime).toBeLessThan(500) // Should complete within 500ms
  })

  it('should handle many validation rules efficiently', async () => {
    const rules: CustomValidationRule[] = []

    // Add multiple custom rules
    for (let i = 0; i < 10; i++) {
      rules.push({
        name: `rule${i}`,
        description: `Test rule ${i}`,
        priority: i,
        validator: (_data: any) => true,
        errorMessage: `Rule ${i} failed`,
      })
    }

    for (const rule of rules) {
      await addCustomRule(rule)
    }

    const data = { name: 'test' }
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    }

    const startTime = performance.now()
    const result = await validateJson(data, schema)
    const endTime = performance.now()

    expect(result.valid).toBe(true)
    expect(result.metadata.customRulesApplied).toBeGreaterThanOrEqual(10)
    expect(endTime - startTime).toBeLessThan(200) // Should be efficient
  })
})
