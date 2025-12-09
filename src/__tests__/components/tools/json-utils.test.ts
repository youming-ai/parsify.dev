import {
  formatJSON,
  isSerializedJsonString,
  isValidJSON,
  minifyJSON,
  parseJSON,
  parseSerializedJson,
} from '@/components/tools/json/json-utils';
import { describe, expect, it } from 'vitest';

describe('JSON Utils', () => {
  describe('isValidJSON', () => {
    it('should return true for valid JSON', () => {
      expect(isValidJSON('{"key": "value"}')).toBe(true);
      expect(isValidJSON('[]')).toBe(true);
      expect(isValidJSON('123')).toBe(true);
      expect(isValidJSON('"string"')).toBe(true);
    });

    it('should return false for invalid JSON', () => {
      expect(isValidJSON('{key: value}')).toBe(false);
      expect(isValidJSON('undefined')).toBe(false);
      expect(isValidJSON('')).toBe(false);
    });
  });

  describe('parseJSON', () => {
    it('should parse valid JSON string', () => {
      const result = parseJSON('{"name": "test", "value": 123}');
      expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('should return null for invalid JSON', () => {
      const result = parseJSON('invalid json');
      expect(result).toBeNull();
    });

    it('should handle arrays', () => {
      const result = parseJSON('[1, 2, 3]');
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('formatJSON', () => {
    it('should format JSON with default indentation', () => {
      const input = '{"name":"test","value":123}';
      const result = formatJSON(input);
      expect(result).toContain('\n');
      expect(result).toContain('  '); // 2 spaces indent
    });

    it('should format JSON with custom indentation', () => {
      const input = '{"name":"test"}';
      const result = formatJSON(input, 4);
      expect(result).toContain('    '); // 4 spaces indent
    });

    it('should return original string if invalid JSON', () => {
      const input = 'invalid json';
      const result = formatJSON(input);
      expect(result).toBe(input);
    });
  });

  describe('minifyJSON', () => {
    it('should remove whitespace from formatted JSON', () => {
      const input = `{
  "name": "test",
  "value": 123
}`;
      const result = minifyJSON(input);
      expect(result).toBe('{"name":"test","value":123}');
    });

    it('should handle already minified JSON', () => {
      const input = '{"name":"test","value":123}';
      const result = minifyJSON(input);
      expect(result).toBe(input);
    });

    it('should return original string if invalid JSON', () => {
      const input = 'invalid json';
      const result = minifyJSON(input);
      expect(result).toBe(input);
    });
  });

  describe('isSerializedJsonString', () => {
    it('should detect JSON string wrapped in quotes with escaped characters', () => {
      // This is: "[{\"key\":\"value\"}]"
      const input = '"[{\\"key\\":\\"value\\"}]"';
      expect(isSerializedJsonString(input)).toBe(true);
    });

    it('should detect object JSON string wrapped in quotes', () => {
      // This is: "{\"name\":\"test\"}"
      const input = '"{\\"name\\":\\"test\\"}"';
      expect(isSerializedJsonString(input)).toBe(true);
    });

    it('should return false for regular valid JSON', () => {
      expect(isSerializedJsonString('{"key": "value"}')).toBe(false);
      expect(isSerializedJsonString('[1, 2, 3]')).toBe(false);
    });

    it('should return false for a simple quoted string', () => {
      expect(isSerializedJsonString('"hello world"')).toBe(false);
    });
  });

  describe('parseSerializedJson', () => {
    it('should parse and format a quoted escaped JSON array', () => {
      // This is: "[{\"key\":\"value\"}]"
      const input = '"[{\\"key\\":\\"value\\"}]"';
      const result = parseSerializedJson(input);
      expect(result).toContain('"key"');
      expect(result).toContain('"value"');
      expect(result).toContain('\n'); // Should be formatted
    });

    it('should parse and format a quoted escaped JSON object', () => {
      // This is: "{\"name\":\"test\",\"count\":123}"
      const input = '"{\\"name\\":\\"test\\",\\"count\\":123}"';
      const result = parseSerializedJson(input);
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({ name: 'test', count: 123 });
    });

    it('should handle multiple levels of escaping', () => {
      // Double escaped JSON (JSON inside JSON string, then escaped again)
      // Original: {"nested": "[{\"key\":\"value\"}]"}
      // Which becomes: "{\"nested\": \"[{\\\"key\\\":\\\"value\\\"}]\"}"
      const input = '"{\\"nested\\": \\"[{\\\\\\"key\\\\\\":\\\\\\"value\\\\\\"}]\\"}"';
      const result = parseSerializedJson(input);
      expect(result).toContain('"nested"');
    });

    it('should throw error for unparseable content', () => {
      expect(() => parseSerializedJson('this is not json')).toThrow(
        'Failed to parse serialized JSON'
      );
    });
  });
});
