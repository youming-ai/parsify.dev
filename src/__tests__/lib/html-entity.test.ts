import { decodeEntities, encodeEntities } from '@/lib/html/entity-utils';
import { describe, expect, it } from 'vitest';

describe('HTML Entity Utils', () => {
  describe('encodeEntities', () => {
    it('encodes ampersand', () => {
      expect(encodeEntities('Hello & World')).toBe('Hello &amp; World');
    });

    it('encodes less than sign', () => {
      expect(encodeEntities('1 < 2')).toBe('1 &lt; 2');
    });

    it('encodes greater than sign', () => {
      expect(encodeEntities('2 > 1')).toBe('2 &gt; 1');
    });

    it('encodes double quote', () => {
      expect(encodeEntities('He said "hello"')).toBe('He said &quot;hello&quot;');
    });

    it('encodes single quote', () => {
      expect(encodeEntities("It's me")).toBe('It&#39;s me');
    });

    it('handles mixed special characters', () => {
      expect(encodeEntities('<a href="url">Link</a>')).toBe(
        '&lt;a href=&quot;url&quot;&gt;Link&lt;/a&gt;'
      );
    });
  });

  describe('decodeEntities', () => {
    it('decodes ampersand', () => {
      expect(decodeEntities('Hello &amp; World')).toBe('Hello & World');
    });

    it('decodes less than sign', () => {
      expect(decodeEntities('1 &lt; 2')).toBe('1 < 2');
    });

    it('decodes greater than sign', () => {
      expect(decodeEntities('2 &gt; 1')).toBe('2 > 1');
    });

    it('decodes double quote', () => {
      expect(decodeEntities('He said &quot;hello&quot;')).toBe('He said "hello"');
    });

    it('decodes single quote', () => {
      expect(decodeEntities('It&apos;s me')).toBe("It's me");
    });

    it('handles numeric character references', () => {
      expect(decodeEntities('&#39;')).toBe("'");
      expect(decodeEntities('&#123;')).toBe('{');
    });

    it('decodes hexadecimal character references', () => {
      expect(decodeEntities('&#x1F600;')).toBe('😀');
    });

    it('handles mixed entity references', () => {
      expect(decodeEntities('&lt;a href=&quot;url&quot;&gt;Link&lt;/a&gt;')).toBe(
        '<a href="url">Link</a>'
      );
    });

    it('leaves text without entities unchanged', () => {
      expect(decodeEntities('Hello World')).toBe('Hello World');
    });
  });

  describe('encode/decode roundtrip', () => {
    it('maintains data integrity through roundtrip', () => {
      const original = '<div>Hello & "World"</div>';
      const encoded = encodeEntities(original);
      const decoded = decodeEntities(encoded);
      expect(decoded).toBe(original);
    });

    it('handles complex HTML entities', () => {
      const original = '<p>&lt;tag&gt;</p>';
      const encoded = encodeEntities(original);
      const decoded = decodeEntities(encoded);
      expect(decoded).toBe(original);
    });

    it('preserves unicode characters', () => {
      const original = '你好世界 🚀';
      const encoded = encodeEntities(original);
      const decoded = decodeEntities(encoded);
      expect(decoded).toBe(original);
    });

    it('handles complex nested HTML', () => {
      const original =
        '<a href="https://example.com?param=value&amp;other=123">Link &amp; Click</a>';
      const encoded = encodeEntities(original);
      const decoded = decodeEntities(encoded);
      expect(decoded).toBe(original);
    });
  });
});
