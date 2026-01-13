import { describe, expect, it } from 'vitest';

// Mock URL utilities
const encodeURL = (text: string): string => {
  return encodeURIComponent(text);
};

const decodeURL = (text: string): string => {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
};

describe('URL Encoding Utils', () => {
  describe('encodeURL', () => {
    it('encodes spaces', () => {
      expect(encodeURL('Hello World')).toBe('Hello%20World');
    });

    it('encodes special characters', () => {
      expect(encodeURL('test@example.com')).toBe('test%40example.com');
      expect(encodeURL('hello&world')).toBe('hello%26world');
    });

    it('encodes unicode characters', () => {
      expect(encodeURL('你好')).toBe('%E4%BD%A0%E5%A5%BD');
    });

    it('does not encode safe characters', () => {
      expect(encodeURL('abc123-_.~')).toBe('abc123-_.~');
    });
  });

  describe('decodeURL', () => {
    it('decodes spaces', () => {
      expect(decodeURL('Hello%20World')).toBe('Hello World');
    });

    it('decodes special characters', () => {
      expect(decodeURL('test%40example.com')).toBe('test@example.com');
    });

    it('decodes unicode characters', () => {
      expect(decodeURL('%E4%BD%A0%E5%A5%BD')).toBe('你好');
    });

    it('handles invalid encoding gracefully', () => {
      expect(() => decodeURL('%')).not.toThrow();
    });
  });

  describe('round-trip encoding', () => {
    it('maintains data integrity', () => {
      const testData = [
        'Hello World',
        'https://example.com/path?query=value',
        'test@example.com',
        'unicode: 你好世界 🚀',
        'special: !@#$%^&*()',
      ];

      testData.forEach((text) => {
        const encoded = encodeURL(text);
        const decoded = decodeURL(encoded);
        expect(decoded).toBe(text);
      });
    });
  });
});
