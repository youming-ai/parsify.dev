import { formatJSON, isValidJSON, minifyJSON, parseJSON } from '@/components/tools/json/json-utils';
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
});
