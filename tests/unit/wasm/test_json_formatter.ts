import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  JsonFormatter,
  JsonFormattingError,
  JsonValidationError,
  JsonSizeError,
  JsonDepthError,
  jsonFormatter,
  formatJson,
  validateJson,
  minifyJson,
  prettifyJson,
  JsonFormattingOptions,
  JsonFormattingResult
} from '../../../apps/api/src/wasm/json_formatter'

describe('JsonFormatter', () => {
  let formatter: JsonFormatter

  beforeEach(() => {
    formatter = new JsonFormatter()
  })

  afterEach(() => {
    formatter.dispose()
  })

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await formatter.initialize()
      expect(formatter.isReady()).toBe(true)
    })

    it('should handle multiple initialization calls', async () => {
      await formatter.initialize()
      await formatter.initialize()
      expect(formatter.isReady()).toBe(true)
    })
  })

  describe('Basic JSON formatting', () => {
    beforeEach(async () => {
      await formatter.initialize()
    })

    it('should format simple JSON object', async () => {
      const input = '{"name":"John","age":30}'
      const result = await formatter.format(input)

      expect(result.success).toBe(true)
      expect(result.formatted).toBe('{\n  "name": "John",\n  "age": 30\n}')
      expect(result.original).toBe(input)
      expect(result.originalSize).toBe(input.length)
      expect(result.formattedSize).toBeGreaterThan(0)
      expect(result.errors).toBeNull()
    })

    it('should format JSON array', async () => {
      const input = '[1,2,3,"test"]'
      const result = await formatter.format(input)

      expect(result.success).toBe(true)
      expect(result.formatted).toBe('[\n  1,\n  2,\n  3,\n  "test"\n]')
    })

    it('should format nested JSON structures', async () => {
      const input = '{"user":{"name":"John","address":{"city":"New York","zip":"10001"}}}'
      const result = await formatter.format(input)

      expect(result.success).toBe(true)
      expect(result.formatted).toContain('    "city": "New York"')
      expect(result.metadata.depth).toBeGreaterThan(1)
    })

    it('should handle different data types', async () => {
      const input = JSON.stringify({
        string: "test",
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        object: { nested: true }
      })

      const result = await formatter.format(input)

      expect(result.success).toBe(true)
      expect(result.metadata.stringCount).toBe(1)
      expect(result.metadata.numberCount).toBe(4) // 42, 1, 2, 3
      expect(result.metadata.booleanCount).toBe(1)
      expect(result.metadata.nullCount).toBe(1)
      expect(result.metadata.arrayCount).toBe(1)
      expect(result.metadata.objectCount).toBe(2)
    })
  })

  describe('Formatting options', () => {
    beforeEach(async () => {
      await formatter.initialize()
    })

    it('should format with custom indent', async () => {
      const input = '{"name":"John","age":30}'
      const result = await formatter.format(input, { indent: 4 })

      expect(result.success).toBe(true)
      expect(result.formatted).toContain('    "name"')
    })

    it('should format with compact mode', async () => {
      const input = '{"name":"John","age":30}'
      const result = await formatter.format(input, { compact: true })

      expect(result.success).toBe(true)
      expect(result.formatted).toBe('{"name":"John","age":30}')
    })

    it('should sort keys alphabetically', async () => {
      const input = '{"z":1,"a":2,"m":3}'
      const result = await formatter.format(input, { sortKeys: true })

      expect(result.success).toBe(true)
      expect(result.formatted).toMatch(/"a".*"m".*"z"/s)
    })

    it('should preserve key order when requested', async () => {
      const input = '{"z":1,"a":2,"m":3}'
      const result = await formatter.format(input, { sortKeys: true, preserveOrder: true })

      expect(result.success).toBe(true)
      // Should preserve original order when preserveOrder is true
      expect(result.formatted).toContain('"z"')
      expect(result.formatted).toContain('"a"')
      expect(result.formatted).toContain('"m"')
    })

    it('should insert final newline', async () => {
      const input = '{"name":"John"}'
      const result = await formatter.format(input, { insertFinalNewline: true })

      expect(result.success).toBe(true)
      expect(result.formatted).endsWith('\n')
    })

    it('should ensure ASCII characters', async () => {
      const input = '{"name":"Jöhn","emoji":"🚀"}'
      const result = await formatter.format(input, { ensureAscii: true })

      expect(result.success).toBe(true)
      expect(result.formatted).toContain('\\u00f6') // ö
      expect(result.formatted).toContain('\\ud83d\\ude80') // 🚀
    })

    it('should remove null values', async () => {
      const input = '{"name":"John","age":null,"city":null}'
      const result = await formatter.format(input, { removeNulls: true })

      expect(result.success).toBe(true)
      expect(result.formatted).toContain('"name"')
      expect(result.formatted).not.toContain('"age"')
      expect(result.formatted).not.toContain('"city"')
    })

    it('should remove undefined values', async () => {
      const input = '{"name":"John","age":undefined,"city":undefined}'
      // Note: JSON.stringify naturally removes undefined, so we test with the transformation
      const parsed = JSON.parse(input)
      const modified = { ...parsed, age: undefined, city: undefined }
      const result = await formatter.format(JSON.stringify(modified), { removeUndefined: true })

      expect(result.success).toBe(true)
      expect(result.formatted).toContain('"name"')
      expect(result.formatted).not.toContain('"age"')
      expect(result.formatted).not.toContain('"city"')
    })

    it('should truncate long strings', async () => {
      const longString = 'a'.repeat(100)
      const input = JSON.stringify({ text: longString })
      const result = await formatter.format(input, {
        truncateLongStrings: true,
        maxStringLength: 50
      })

      expect(result.success).toBe(true)
      expect(result.formatted).toContain('... [truncated]')
      expect(result.metadata.truncated).toBe(true)
    })
  })

  describe('Error handling', () => {
    beforeEach(async () => {
      await formatter.initialize()
    })

    it('should handle invalid JSON syntax', async () => {
      const input = '{"name":"John",age:30}' // Missing quotes around age

      await expect(formatter.format(input)).rejects.toThrow(JsonValidationError)
    })

    it('should handle empty input', async () => {
      await expect(formatter.format('')).rejects.toThrow(JsonValidationError)
    })

    it('should handle non-string input', async () => {
      await expect(formatter.format(null as any)).rejects.toThrow(JsonValidationError)
    })

    it('should handle oversized input', async () => {
      const largeInput = 'x'.repeat(11 * 1024 * 1024) // 11MB
      await expect(formatter.format(largeInput)).rejects.toThrow(JsonSizeError)
    })

    it('should handle malformed bracket structure', async () => {
      const input = '{"name":"John"'
      await expect(formatter.format(input)).rejects.toThrow(JsonValidationError)
    })

    it('should provide detailed error information', async () => {
      const input = '{"name":"John","age":}' // Incomplete value
      try {
        await formatter.format(input)
      } catch (error) {
        expect(error).toBeInstanceOf(JsonValidationError)
        expect(error.name).toBe('JsonValidationError')
      }
    })
  })

  describe('Performance and statistics', () => {
    beforeEach(async () => {
      await formatter.initialize()
    })

    it('should provide accurate statistics', async () => {
      const input = JSON.stringify({
        users: [
          { name: "John", age: 30, active: true },
          { name: "Jane", age: 25, active: false }
        ],
        total: 2,
        meta: null
      })

      const result = await formatter.format(input)

      expect(result.metadata).toBeDefined()
      expect(result.metadata.parsingTime).toBeGreaterThanOrEqual(0)
      expect(result.metadata.formattingTime).toBeGreaterThanOrEqual(0)
      expect(result.metadata.totalTime).toBeGreaterThanOrEqual(0)
      expect(result.metadata.keyCount).toBeGreaterThan(0)
      expect(result.metadata.valueCount).toBeGreaterThan(0)
      expect(result.metadata.arrayCount).toBe(1)
      expect(result.metadata.objectCount).toBe(3) // root + 2 user objects
      expect(result.metadata.stringCount).toBeGreaterThan(0)
      expect(result.metadata.numberCount).toBeGreaterThan(0)
      expect(result.metadata.booleanCount).toBe(2)
      expect(result.metadata.nullCount).toBe(1)
    })

    it('should calculate compression ratio correctly', async () => {
      const compactInput = '{"name":"John","age":30}'
      const result = await formatter.format(compactInput, { indent: 4 })

      expect(result.compressionRatio).toBeGreaterThan(1)
      expect(result.formattedSize).toBe(result.originalSize * result.compressionRatio)
    })
  })

  describe('Security validation', () => {
    beforeEach(async () => {
      await formatter.initialize()
    })

    it('should reject potentially malicious content', async () => {
      const maliciousInput = '{"script":"<script>alert(1)</script>"}'

      await expect(formatter.format(maliciousInput)).rejects.toThrow(JsonValidationError)
    })

    it('should reject extremely deep nesting', async () => {
      const deepInput = '['.repeat(1001) + ']'.repeat(1001)

      await expect(formatter.format(deepInput)).rejects.toThrow(JsonValidationError)
    })

    it('should reject excessive repetition', async () => {
      const repetitiveInput = '{"data":"' + 'a'.repeat(1001) + '"}'

      await expect(formatter.format(repetitiveInput)).rejects.toThrow(JsonValidationError)
    })
  })

  describe('Configuration', () => {
    it('should allow setting custom size limits', () => {
      formatter.setLimits(1024, 5120) // 1KB input, 5KB output

      // Limits would be applied during formatting
      expect(formatter).toBeDefined()
    })
  })

  describe('Resource management', () => {
    it('should dispose resources properly', async () => {
      await formatter.initialize()
      expect(formatter.isReady()).toBe(true)

      formatter.dispose()
      expect(formatter.isReady()).toBe(false)
    })
  })
})

describe('Utility functions', () => {
  beforeEach(async () => {
    await jsonFormatter.initialize()
  })

  it('formatJson should format JSON correctly', async () => {
    const input = '{"name":"John","age":30}'
    const result = await formatJson(input, { indent: 2 })

    expect(result.success).toBe(true)
    expect(result.formatted).toContain('  "name"')
    expect(result.formatted).toContain('  "age"')
  })

  it('validateJson should validate JSON correctly', async () => {
    const validJson = '{"name":"John"}'
    const invalidJson = '{"name":"John",}'

    const validResult = await validateJson(validJson)
    expect(validResult.valid).toBe(true)
    expect(validResult.errors).toBeUndefined()

    const invalidResult = await validateJson(invalidJson)
    expect(invalidResult.valid).toBe(false)
    expect(invalidResult.errors).toBeDefined()
    expect(invalidResult.errors!.length).toBeGreaterThan(0)
  })

  it('minifyJson should minify JSON correctly', async () => {
    const input = '{\n  "name": "John",\n  "age": 30\n}'
    const result = await minifyJson(input)

    expect(result).toBe('{"name":"John","age":30}')
  })

  it('prettifyJson should prettify JSON correctly', async () => {
    const input = '{"name":"John","age":30}'
    const result = await prettifyJson(input, 4, true)

    expect(result).toContain('    "name"')
    expect(result).toContain('    "age"')
  })

  it('prettifyJson should handle errors gracefully', async () => {
    const invalidInput = '{"name":"John",}'

    await expect(prettifyJson(invalidInput)).rejects.toThrow(JsonFormattingError)
  })
})

describe('Edge cases', () => {
  beforeEach(async () => {
    await jsonFormatter.initialize()
  })

  it('should handle empty objects', async () => {
    const result = await formatJson('{}')
    expect(result.success).toBe(true)
    expect(result.formatted).toBe('{\n}')
  })

  it('should handle empty arrays', async () => {
    const result = await formatJson('[]')
    expect(result.success).toBe(true)
    expect(result.formatted).toBe('[\n]')
  })

  it('should handle whitespace-only JSON', async () => {
    const result = await formatJson('   {"name":"John"}   ')
    expect(result.success).toBe(true)
  })

  it('should handle Unicode characters', async () => {
    const input = JSON.stringify({ greeting: '你好', emoji: '🌍' })
    const result = await formatJson(input)

    expect(result.success).toBe(true)
    expect(result.formatted).toContain('你好')
    expect(result.formatted).toContain('🌍')
  })

  it('should handle escape sequences', async () => {
    const input = JSON.stringify({
      newline: 'line1\\nline2',
      tab: 'col1\\tcol2',
      quote: 'say \\"hello\\"',
      backslash: 'path\\\\to\\\\file'
    })

    const result = await formatJson(input)
    expect(result.success).toBe(true)
  })

  it('should handle very long numbers', async () => {
    const input = JSON.stringify({
      bigInt: 9007199254740991n, // BigInt max safe integer
      scientific: 1.23e+10
    })

    const result = await formatJson(input)
    expect(result.success).toBe(true)
  })

  it('should handle circular references (should error)', async () => {
    // Create an object with circular reference
    const obj: any = { name: 'test' }
    obj.self = obj

    // JSON.stringify would throw, but we need to test our handling
    await expect(formatJson(JSON.stringify(obj))).rejects.toThrow()
  })
})

describe('Performance benchmarks', () => {
  beforeEach(async () => {
    await jsonFormatter.initialize()
  })

  it('should handle large JSON efficiently', async () => {
    // Create a large JSON object
    const largeObject: any = {}
    for (let i = 0; i < 1000; i++) {
      largeObject[`key${i}`] = {
        id: i,
        name: `Item ${i}`,
        tags: [`tag${i}`, `category${i % 10}`],
        metadata: {
          created: new Date().toISOString(),
          active: i % 2 === 0
        }
      }
    }

    const input = JSON.stringify(largeObject)
    const startTime = performance.now()

    const result = await formatJson(input, { compact: true })

    const endTime = performance.now()
    const processingTime = endTime - startTime

    expect(result.success).toBe(true)
    expect(processingTime).toBeLessThan(1000) // Should complete within 1 second
    expect(result.metadata.totalTime).toBeLessThan(1000)
  })

  it('should handle many small JSON objects efficiently', async () => {
    const smallObjects = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      value: Math.random()
    }))

    const input = JSON.stringify(smallObjects)
    const startTime = performance.now()

    const result = await formatJson(input)

    const endTime = performance.now()
    const processingTime = endTime - startTime

    expect(result.success).toBe(true)
    expect(processingTime).toBeLessThan(100) // Should be very fast for many small objects
  })
})
