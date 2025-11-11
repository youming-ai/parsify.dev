/**
 * Comprehensive unit tests for JSON processing utilities
 * Tests JSON validation, formatting, and manipulation functions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateJson,
  formatJson,
  minifyJson,
  sortJsonKeys,
  parseJsonPath,
  extractJsonPaths,
  transformJsonData
} from '@/lib/json-processing';
import fixtures from '../fixtures/tools-fixtures';

describe('JSON Processing Utilities', () => {
  beforeEach(() => {
    // Clear any module caches or global state
    vi.clearAllMocks();
  });

  describe('validateJson', () => {
    it('should validate correct JSON strings', () => {
      const validInputs = [
        fixtures.json.valid.simple,
        fixtures.json.valid.complex,
        fixtures.json.valid.nestedArrays,
      ];

      validInputs.forEach(input => {
        const result = validateJson(JSON.stringify(input));
        expect(result.isValid).toBe(true);
        expect(result.data).toEqual(input);
        expect(result.error).toBeNull();
      });
    });

    it('should reject invalid JSON strings', () => {
      const invalidInputs = [
        fixtures.json.invalid.syntaxError,
        fixtures.json.invalid.commaError,
        fixtures.json.invalid.quoteError,
        fixtures.json.invalid.typeError,
      ];

      invalidInputs.forEach(input => {
        const result = validateJson(input);
        expect(result.isValid).toBe(false);
        expect(result.data).toBeNull();
        expect(result.error).toBeDefined();
        expect(result.error?.message).toContain('Unexpected token');
      });
    });

    it('should handle edge cases', () => {
      // Empty string
      expect(validateJson('').isValid).toBe(false);

      // Null and undefined
      expect(validateJson(null as any).isValid).toBe(false);
      expect(validateJson(undefined as any).isValid).toBe(false);

      // Valid JSON primitives
      expect(validateJson('true').isValid).toBe(true);
      expect(validateJson('false').isValid).toBe(true);
      expect(validateJson('null').isValid).toBe(true);
      expect(validateJson('123').isValid).toBe(true);
      expect(validateJson('"string"').isValid).toBe(true);

      // Empty array and object
      expect(validateJson('[]').isValid).toBe(true);
      expect(validateJson('{}').isValid).toBe(true);
    });

    it('should provide detailed error information', () => {
      const result = validateJson('{ "key": value }');
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toBeDefined();
      expect(result.error?.line).toBeDefined();
      expect(result.error?.column).toBeDefined();
    });
  });

  describe('formatJson', () => {
    it('should format JSON with 2-space indentation by default', () => {
      const input = { name: 'John', age: 30 };
      const result = formatJson(input);

      expect(result).toContain('  "name": "John"');
      expect(result).toContain('  "age": 30');
      expect(result.split('\n').length).toBeGreaterThan(1);
    });

    it('should format with custom indentation', () => {
      const input = { name: 'John', age: 30 };
      const result2 = formatJson(input, 2);
      const result4 = formatJson(input, 4);

      expect(result2).toContain('  "name": "John"');
      expect(result4).toContain('    "name": "John"');
    });

    it('should sort keys when requested', () => {
      const input = { z: 1, a: 2, m: 3 };
      const result = formatJson(input, 2, true);

      // Keys should be in alphabetical order
      const lines = result.split('\n');
      const aIndex = lines.findIndex(line => line.includes('"a"'));
      const mIndex = lines.findIndex(line => line.includes('"m"'));
      const zIndex = lines.findIndex(line => line.includes('"z"'));

      expect(aIndex).toBeLessThan(mIndex);
      expect(mIndex).toBeLessThan(zIndex);
    });

    it('should handle complex nested structures', () => {
      const result = formatJson(fixtures.json.valid.complex);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);

      // Should be valid JSON
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should preserve special values', () => {
      const input = {
        null: null,
        undefined: undefined,
        number: 42,
        boolean: true,
        string: 'hello',
        array: [1, 2, 3],
      };

      const result = formatJson(input);
      const parsed = JSON.parse(result);

      expect(parsed.null).toBeNull();
      expect(parsed.number).toBe(42);
      expect(parsed.boolean).toBe(true);
      expect(parsed.string).toBe('hello');
      expect(parsed.array).toEqual([1, 2, 3]);
    });
  });

  describe('minifyJson', () => {
    it('should remove unnecessary whitespace', () => {
      const input = {
        name: 'John',
        age: 30,
        address: {
          street: '123 Main St',
          city: 'New York'
        }
      };

      const result = minifyJson(input);

      // Should not contain newlines or extra spaces
      expect(result).not.toContain('\n');
      expect(result).not.toContain('  ');

      // Should be valid JSON
      expect(() => JSON.parse(result)).not.toThrow();

      // Should round-trip correctly
      expect(JSON.parse(result)).toEqual(input);
    });

    it('should handle large JSON efficiently', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        data: { nested: { value: i * 2 } }
      }));

      const startTime = performance.now();
      const result = minifyJson(largeArray);
      const endTime = performance.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);

      // Should be valid and correct
      const parsed = JSON.parse(result);
      expect(parsed).toEqual(largeArray);
    });
  });

  describe('sortJsonKeys', () => {
    it('should sort object keys alphabetically', () => {
      const input = { zebra: 1, apple: 2, banana: 3 };
      const result = sortJsonKeys(input);

      const keys = Object.keys(result);
      expect(keys).toEqual(['apple', 'banana', 'zebra']);
    });

    it('should handle nested objects', () => {
      const input = {
        outer: {
          zebra: 1,
          apple: 2
        },
        middle: {
          banana: 3,
          cherry: 4
        }
      };

      const result = sortJsonKeys(input);

      const outerKeys = Object.keys(result.outer);
      const middleKeys = Object.keys(result.middle);

      expect(outerKeys).toEqual(['apple', 'zebra']);
      expect(middleKeys).toEqual(['banana', 'cherry']);
    });

    it('should handle arrays correctly', () => {
      const input = {
        items: [
          { zebra: 1, apple: 2 },
          { banana: 3, cherry: 4 }
        ]
      };

      const result = sortJsonKeys(input);

      expect(result.items).toHaveLength(2);
      expect(Object.keys(result.items[0])).toEqual(['apple', 'zebra']);
      expect(Object.keys(result.items[1])).toEqual(['banana', 'cherry']);
    });

    it('should preserve non-object values', () => {
      const input = {
        string: 'hello',
        number: 42,
        boolean: true,
        null: null,
        array: [3, 1, 2],
        object: { zebra: 1, apple: 2 }
      };

      const result = sortJsonKeys(input);

      expect(result.string).toBe('hello');
      expect(result.number).toBe(42);
      expect(result.boolean).toBe(true);
      expect(result.null).toBeNull();
      expect(result.array).toEqual([3, 1, 2]);
      expect(Object.keys(result.object)).toEqual(['apple', 'zebra']);
    });
  });

  describe('parseJsonPath', () => {
    it('should parse simple JSONPath expressions', () => {
      const cases = [
        { path: '$.name', expected: { type: 'property', value: 'name' } },
        { path: '$.users[0]', expected: { type: 'array', index: 0, property: 'users' } },
        { path: '$.data.items[1]', expected: { type: 'nested', path: ['data', 'items', 1] } },
      ];

      cases.forEach(({ path, expected }) => {
        const result = parseJsonPath(path);
        expect(result).toMatchObject(expected);
      });
    });

    it('should handle complex JSONPath expressions', () => {
      const path = '$.store.book[*].author';
      const result = parseJsonPath(path);

      expect(result.type).toBe('wildcard');
      expect(result.path).toContain('store');
      expect(result.path).toContain('book');
      expect(result.path).toContain('author');
    });

    it('should reject invalid paths', () => {
      const invalidPaths = [
        '',
        'invalid',
        '$.',
        '$..',
      ];

      invalidPaths.forEach(path => {
        expect(() => parseJsonPath(path)).toThrow();
      });
    });
  });

  describe('extractJsonPaths', () => {
    it('should extract values using simple paths', () => {
      const data = {
        name: 'John',
        age: 30,
        address: {
          street: '123 Main St',
          city: 'New York'
        }
      };

      expect(extractJsonPaths(data, '$.name')).toBe('John');
      expect(extractJsonPaths(data, '$.age')).toBe(30);
      expect(extractJsonPaths(data, '$.address.city')).toBe('New York');
    });

    it('should handle array paths', () => {
      const data = {
        users: [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 }
        ]
      };

      expect(extractJsonPaths(data, '$.users[0].name')).toBe('John');
      expect(extractJsonPaths(data, '$.users[1].age')).toBe(25);
    });

    it('should handle wildcard paths', () => {
      const data = {
        users: [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 }
        ]
      };

      const names = extractJsonPaths(data, '$.users[*].name') as string[];
      expect(names).toEqual(['John', 'Jane']);
    });

    it('should return undefined for non-existent paths', () => {
      const data = { name: 'John' };

      expect(extractJsonPaths(data, '$.nonexistent')).toBeUndefined();
      expect(extractJsonPaths(data, '$.user.name')).toBeUndefined();
    });

    it('should handle deep nested structures', () => {
      const data = fixtures.json.valid.complex;

      const userEmail = extractJsonPaths(data, '$.user.email');
      expect(userEmail).toBe('alice@example.com');

      const firstOrderTotal = extractJsonPaths(data, '$.orders[0].total');
      expect(firstOrderTotal).toBe(99.99);
    });
  });

  describe('transformJsonData', () => {
    it('should apply simple transformations', () => {
      const data = { name: 'john', age: '30', active: 'true' };
      const schema = {
        name: (val: string) => val.charAt(0).toUpperCase() + val.slice(1),
        age: (val: string) => parseInt(val, 10),
        active: (val: string) => val === 'true'
      };

      const result = transformJsonData(data, schema);

      expect(result).toEqual({
        name: 'John',
        age: 30,
        active: true
      });
    });

    it('should handle nested transformations', () => {
      const data = {
        user: {
          firstName: 'john',
          lastName: 'doe'
        },
        metadata: {
          created: '2023-01-01',
          tags: ['tag1', 'tag2']
        }
      };

      const schema = {
        user: {
          firstName: (val: string) => val.charAt(0).toUpperCase() + val.slice(1),
          lastName: (val: string) => val.charAt(0).toUpperCase() + val.slice(1)
        },
        metadata: {
          created: (val: string) => new Date(val),
          tags: (val: string[]) => val.map(tag => tag.toUpperCase())
        }
      };

      const result = transformJsonData(data, schema);

      expect(result.user.firstName).toBe('John');
      expect(result.user.lastName).toBe('Doe');
      expect(result.metadata.created).toBeInstanceOf(Date);
      expect(result.metadata.tags).toEqual(['TAG1', 'TAG2']);
    });

    it('should handle array transformations', () => {
      const data = {
        items: [
          { name: 'item1', price: '10.99' },
          { name: 'item2', price: '15.50' }
        ]
      };

      const schema = {
        items: (items: any[]) => items.map(item => ({
          ...item,
          price: parseFloat(item.price),
          name: item.name.toUpperCase()
        }))
      };

      const result = transformJsonData(data, schema);

      expect(result.items).toEqual([
        { name: 'ITEM1', price: 10.99 },
        { name: 'ITEM2', price: 15.50 }
      ]);
    });

    it('should handle conditional transformations', () => {
      const data = {
        status: 'active',
        value: 100,
        type: 'premium'
      };

      const schema = {
        status: (val: string) => val === 'active' ? 'online' : 'offline',
        value: (val: number, ctx: any) => ctx.type === 'premium' ? val * 0.9 : val,
        type: (val: string) => val.toUpperCase()
      };

      const result = transformJsonData(data, schema);

      expect(result.status).toBe('online');
      expect(result.value).toBe(90); // 10% discount for premium
      expect(result.type).toBe('PREMIUM');
    });
  });

  describe('Performance Tests', () => {
    it('should handle large JSON efficiently', () => {
      const largeObject = {
        data: Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `Description for item ${i}`.repeat(10),
          metadata: {
            created: new Date().toISOString(),
            tags: Array.from({ length: 5 }, (_, j) => `tag-${i}-${j}`)
          }
        }))
      };

      const startTime = performance.now();
      const formatted = formatJson(largeObject, 2, true);
      const endTime = performance.now();

      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000);

      // Should produce valid JSON
      expect(() => JSON.parse(formatted)).not.toThrow();
    });

    it('should validate large JSON efficiently', () => {
      const largeJson = JSON.stringify({
        data: Array.from({ length: 5000 }, (_, i) => ({ id: i, value: `item-${i}` }))
      });

      const startTime = performance.now();
      const result = validateJson(largeJson);
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle circular references gracefully', () => {
      const obj: any = { name: 'test' };
      obj.self = obj;

      expect(() => formatJson(obj)).toThrow();
      expect(() => JSON.stringify(obj)).toThrow();
    });

    it('should handle undefined values in objects', () => {
      const data = {
        defined: 'value',
        undefined: undefined,
        null: null
      };

      const formatted = formatJson(data);
      const parsed = JSON.parse(formatted);

      expect(parsed.defined).toBe('value');
      expect(parsed.undefined).toBeUndefined();
      expect(parsed.null).toBeNull();
    });

    it('should handle special numeric values', () => {
      const data = {
        infinity: Infinity,
        negativeInfinity: -Infinity,
        notANumber: NaN,
        normal: 42
      };

      expect(() => formatJson(data)).not.toThrow();

      // JSON should convert special values to null
      const formatted = formatJson(data);
      const parsed = JSON.parse(formatted);

      expect(parsed.normal).toBe(42);
      expect(parsed.infinity).toBeNull();
      expect(parsed.negativeInfinity).toBeNull();
      expect(parsed.notANumber).toBeNull();
    });
  });
});
