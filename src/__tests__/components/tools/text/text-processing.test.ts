import { describe, it, expect, beforeEach } from 'vitest';
import { Processor } from '@/lib/processing';

describe('Text Processing Utilities', () => {
  const sampleText = 'Hello World! This is a test text with multiple words and sentences.';
  const sampleMultilineText = `Line 1
Line 2 with some content
Line 3 with special chars: !@#$%^&*()
Line 4 with numbers: 1234567890`;

  describe('Text Encoding', () => {
    it('should encode text to base64', async () => {
      const result = await Processor.processText(sampleText, 'encode', { encoding: 'base64' });

      expect(result.success).toBe(true);
      expect(result.result).toBe(btoa(sampleText));
      expect(result.metrics).toBeDefined();
      expect(result.metrics.duration).toBeGreaterThan(0);
      expect(result.metrics.inputSize).toBe(sampleText.length);
    });

    it('should encode text to URL encoding', async () => {
      const textWithSpecialChars = 'Hello World! How are you?';
      const result = await Processor.processText(textWithSpecialChars, 'encode', { encoding: 'url' });

      expect(result.success).toBe(true);
      expect(result.result).toBe(encodeURIComponent(textWithSpecialChars));
    });

    it('should encode text to HTML entities', async () => {
      const htmlText = '<div>Hello & "World"</div>';
      const result = await Processor.processText(htmlText, 'encode', { encoding: 'html' });

      expect(result.success).toBe(true);
      expect(result.result).toBe('&lt;div&gt;Hello &amp; &quot;World&quot;&lt;/div&gt;');
    });

    it('should encode text to Unicode escape sequences', async () => {
      const result = await Processor.processText(sampleText, 'encode', { encoding: 'unicode' });

      expect(result.success).toBe(true);
      expect(result.result).toMatch(/\\u[0-9a-fA-F]{4}/);
    });

    it('should encode text to hex', async () => {
      const result = await Processor.processText(sampleText, 'encode', { encoding: 'hex' });

      expect(result.success).toBe(true);
      expect(result.result).toMatch(/^[0-9a-fA-F]+$/);
    });

    it('should encode text to binary', async () => {
      const result = await Processor.processText('Hi', 'encode', { encoding: 'binary' });

      expect(result.success).toBe(true);
      expect(result.result).toMatch(/^[01]+( [01]+)*$/);
    });

    it('should handle unsupported encoding', async () => {
      const result = await Processor.processText(sampleText, 'encode', { encoding: 'unsupported' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('TEXT_PROCESSING_ERROR');
      expect(result.error?.message).toContain('Unsupported encoding');
    });
  });

  describe('Text Decoding', () => {
    it('should decode base64 text', async () => {
      const encoded = btoa(sampleText);
      const result = await Processor.processText(encoded, 'decode', { encoding: 'base64' });

      expect(result.success).toBe(true);
      expect(result.result).toBe(sampleText);
    });

    it('should decode URL encoded text', async () => {
      const encoded = encodeURIComponent(sampleText);
      const result = await Processor.processText(encoded, 'decode', { encoding: 'url' });

      expect(result.success).toBe(true);
      expect(result.result).toBe(sampleText);
    });

    it('should decode HTML entities', async () => {
      const encoded = '&lt;div&gt;Hello &amp; &quot;World&quot;&lt;/div&gt;';
      const result = await Processor.processText(encoded, 'decode', { encoding: 'html' });

      expect(result.success).toBe(true);
      expect(result.result).toBe('<div>Hello & "World"</div>');
    });

    it('should decode Unicode escape sequences', async () => {
      const encoded = '\\u0048\\u0065\\u006C\\u006C\\u006F'; // "Hello" in Unicode
      const result = await Processor.processText(encoded, 'decode', { encoding: 'unicode' });

      expect(result.success).toBe(true);
      expect(result.result).toBe('Hello');
    });

    it('should decode hex text', async () => {
      const text = 'Hello';
      const encoder = new TextEncoder();
      const encoded = Array.from(encoder.encode(text))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');

      const result = await Processor.processText(encoded, 'decode', { encoding: 'hex' });

      expect(result.success).toBe(true);
      expect(result.result).toBe(text);
    });

    it('should decode binary text', async () => {
      const text = 'Hi';
      const encoder = new TextEncoder();
      const encoded = Array.from(encoder.encode(text))
        .map(byte => byte.toString(2).padStart(8, '0'))
        .join(' ');

      const result = await Processor.processText(encoded, 'decode', { encoding: 'binary' });

      expect(result.success).toBe(true);
      expect(result.result).toBe(text);
    });

    it('should handle invalid base64 gracefully', async () => {
      const invalidBase64 = 'Invalid@Base64!!!';
      const result = await Processor.processText(invalidBase64, 'decode', { encoding: 'base64' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle unsupported decoding', async () => {
      const result = await Processor.processText(sampleText, 'decode', { encoding: 'unsupported' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('TEXT_PROCESSING_ERROR');
    });
  });

  describe('Text Formatting', () => {
    it('should convert text to uppercase', async () => {
      const result = await Processor.processText(sampleText, 'format', { caseType: 'upper' });

      expect(result.success).toBe(true);
      expect(result.result).toBe(sampleText.toUpperCase());
    });

    it('should convert text to lowercase', async () => {
      const result = await Processor.processText(sampleText, 'format', { caseType: 'lower' });

      expect(result.success).toBe(true);
      expect(result.result).toBe(sampleText.toLowerCase());
    });

    it('should convert text to title case', async () => {
      const text = 'hello world this is a test';
      const result = await Processor.processText(text, 'format', { caseType: 'title' });

      expect(result.success).toBe(true);
      expect(result.result).toBe('Hello World This Is A Test');
    });

    it('should convert text to sentence case', async () => {
      const text = 'HELLO WORLD THIS IS A TEST';
      const result = await Processor.processText(text, 'format', { caseType: 'sentence' });

      expect(result.success).toBe(true);
      expect(result.result).toBe('Hello world this is a test');
    });

    it('should convert text to camelCase', async () => {
      const text = 'hello_world_test';
      const result = await Processor.processText(text, 'format', { caseType: 'camel' });

      expect(result.success).toBe(true);
      expect(result.result).toBe('helloWorldTest');
    });

    it('should convert text to snake_case', async () => {
      const text = 'helloWorldTest';
      const result = await Processor.processText(text, 'format', { caseType: 'snake' });

      expect(result.success).toBe(true);
      expect(result.result).toBe('hello_world_test');
    });

    it('should trim whitespace from text', async () => {
      const textWithSpaces = '   Hello World   ';
      const result = await Processor.processText(textWithSpaces, 'format', { trim: true });

      expect(result.success).toBe(true);
      expect(result.result).toBe('Hello World');
    });

    it('should remove extra spaces', async () => {
      const textWithExtraSpaces = 'Hello    World   This   is   a   test';
      const result = await Processor.processText(textWithExtraSpaces, 'format', { removeExtraSpaces: true });

      expect(result.success).toBe(true);
      expect(result.result).toBe('Hello World This is a test');
    });

    it('should normalize Unicode text', async () => {
      const text = 'café'; // Mix of normal and combining characters
      const result = await Processor.processText(text, 'format', { normalize: true });

      expect(result.success).toBe(true);
      expect(result.result).toBe(text.normalize('NFC'));
    });

    it('should apply multiple formatting options', async () => {
      const text = '   HELLO    WORLD   ';
      const result = await Processor.processText(text, 'format', {
        caseType: 'lower',
        trim: true,
        removeExtraSpaces: true
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe('hello world');
    });
  });

  describe('Text Transformation', () => {
    it('should perform simple find and replace', async () => {
      const result = await Processor.processText(sampleText, 'transform', {
        find: 'World',
        replace: 'Universe'
      });

      expect(result.success).toBe(true);
      expect(result.result).toContain('Universe');
      expect(result.result).not.toContain('World');
    });

    it('should perform regex find and replace', async () => {
      const text = 'Hello 123 World 456 Test';
      const result = await Processor.processText(text, 'transform', {
        find: '\\d+',
        replace: 'NUM',
        regex: true
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe('Hello NUM World NUM Test');
    });

    it('should handle regex with flags', async () => {
      const text = 'hello world hello test';
      const result = await Processor.processText(text, 'transform', {
        find: 'hello',
        replace: 'hi',
        regex: true
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe('hi world hi test');
    });

    it('should handle empty find string', async () => {
      const result = await Processor.processText(sampleText, 'transform', {
        find: '',
        replace: 'test'
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe(sampleText);
    });

    it('should handle transformation without find/replace', async () => {
      const result = await Processor.processText(sampleText, 'transform', {});

      expect(result.success).toBe(true);
      expect(result.result).toBe(sampleText);
    });
  });

  describe('Text Validation', () => {
    it('should validate text with length constraints', async () => {
      const result = await Processor.processText('Hello', 'validate', {
        minLength: 3,
        maxLength: 10
      });

      expect(result.success).toBe(true);
      const validation = JSON.parse(result.result);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should fail validation for text too short', async () => {
      const result = await Processor.processText('Hi', 'validate', {
        minLength: 5
      });

      expect(result.success).toBe(true);
      const validation = JSON.parse(result.result);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Text must be at least 5 characters long');
    });

    it('should fail validation for text too long', async () => {
      const result = await Processor.processText('This is a very long text', 'validate', {
        maxLength: 10
      });

      expect(result.success).toBe(true);
      const validation = JSON.parse(result.result);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Text must be no more than 10 characters long');
    });

    it('should validate text with pattern matching', async () => {
      const email = 'test@example.com';
      const result = await Processor.processText(email, 'validate', {
        pattern: '^[^@]+@[^@]+\\.[^@]+$'
      });

      expect(result.success).toBe(true);
      const validation = JSON.parse(result.result);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should fail validation for pattern mismatch', async () => {
      const invalidEmail = 'not-an-email';
      const result = await Processor.processText(invalidEmail, 'validate', {
        pattern: '^[^@]+@[^@]+\\.[^@]+$'
      });

      expect(result.success).toBe(true);
      const validation = JSON.parse(result.result);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Text does not match required pattern');
    });

    it('should validate allowed characters', async () => {
      const numericText = '123456';
      const result = await Processor.processText(numericText, 'validate', {
        allowedChars: '0-9'
      });

      expect(result.success).toBe(true);
      const validation = JSON.parse(result.result);
      expect(validation.valid).toBe(true);
    });

    it('should fail validation for forbidden characters', async () => {
      const textWithSpecialChars = 'Hello@World!';
      const result = await Processor.processText(textWithSpecialChars, 'validate', {
        forbiddenChars: '@!'
      });

      expect(result.success).toBe(true);
      const validation = JSON.parse(result.result);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Text contains forbidden characters');
    });

    it('should handle multiple validation constraints', async () => {
      const result = await Processor.processText('ab', 'validate', {
        minLength: 5,
        maxLength: 10,
        pattern: '^[0-9]+$'
      });

      expect(result.success).toBe(true);
      const validation = JSON.parse(result.result);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle null input', async () => {
      const result = await Processor.processText(null as any, 'encode', { encoding: 'base64' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle undefined input', async () => {
      const result = await Processor.processText(undefined as any, 'encode', { encoding: 'base64' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle empty text', async () => {
      const result = await Processor.processText('', 'encode', { encoding: 'base64' });

      expect(result.success).toBe(true);
      expect(result.result).toBe('');
    });

    it('should handle unsupported operations', async () => {
      const result = await Processor.processText(sampleText, 'unsupported', {});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('TEXT_PROCESSING_ERROR');
      expect(result.error?.message).toContain('Unknown text operation');
    });

    it('should provide helpful error messages', async () => {
      const result = await Processor.processText(sampleText, 'decode', { encoding: 'base64' });

      if (!result.success) {
        expect(result.error?.message).toBeDefined();
        expect(result.error?.suggestions).toBeDefined();
        expect(result.error?.recoverable).toBe(true);
      }
    });
  });

  describe('Performance Metrics', () => {
    it('should provide accurate processing metrics', async () => {
      const result = await Processor.processText(sampleText, 'encode', { encoding: 'base64' });

      expect(result.metrics).toBeDefined();
      expect(result.metrics.duration).toBeGreaterThan(0);
      expect(result.metrics.inputSize).toBe(sampleText.length);
      expect(result.metrics.outputSize).toBeGreaterThan(0);
      expect(result.metrics.compressionRatio).toBeDefined();
    });

    it('should handle large text efficiently', async () => {
      const largeText = sampleText.repeat(1000);

      const startTime = Date.now();
      const result = await Processor.processText(largeText, 'encode', { encoding: 'base64' });
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result.metrics.duration).toBeLessThan(1000);
    });

    it('should calculate compression ratio correctly', async () => {
      const result = await Processor.processText(sampleText, 'encode', { encoding: 'base64' });

      expect(result.metrics.compressionRatio).toBeDefined();
      expect(result.metrics.compressionRatio).toBeGreaterThan(0);

      const expectedRatio = result.metrics.outputSize / result.metrics.inputSize;
      expect(Math.abs(result.metrics.compressionRatio! - expectedRatio)).toBeLessThan(0.01);
    });
  });

  describe('Edge Cases', () => {
    it('should handle text with emoji', async () => {
      const emojiText = 'Hello 🌍 World 🚀';
      const result = await Processor.processText(emojiText, 'encode', { encoding: 'base64' });

      expect(result.success).toBe(true);

      const decodeResult = await Processor.processText(result.result, 'decode', { encoding: 'base64' });
      expect(decodeResult.success).toBe(true);
      expect(decodeResult.result).toBe(emojiText);
    });

    it('should handle text with newlines', async () => {
      const result = await Processor.processText(sampleMultilineText, 'encode', { encoding: 'base64' });

      expect(result.success).toBe(true);

      const decodeResult = await Processor.processText(result.result, 'decode', { encoding: 'base64' });
      expect(decodeResult.success).toBe(true);
      expect(decodeResult.result).toBe(sampleMultilineText);
    });

    it('should handle text with tabs', async () => {
      const textWithTabs = 'Hello\tWorld\tTest';
      const result = await Processor.processText(textWithTabs, 'encode', { encoding: 'base64' });

      expect(result.success).toBe(true);

      const decodeResult = await Processor.processText(result.result, 'decode', { encoding: 'base64' });
      expect(decodeResult.success).toBe(true);
      expect(decodeResult.result).toBe(textWithTabs);
    });

    it('should handle very long single word', async () => {
      const longWord = 'a'.repeat(1000);
      const result = await Processor.processText(longWord, 'format', { caseType: 'upper' });

      expect(result.success).toBe(true);
      expect(result.result).toBe(longWord.toUpperCase());
    });

    it('should handle mixed case conversions', async () => {
      const mixedText = 'helloWORLDtestCASE';
      const result = await Processor.processText(mixedText, 'format', { caseType: 'camel' });

      expect(result.success).toBe(true);
      expect(result.result).toMatch(/^[a-z][A-Za-z]*$/);
    });
  });

  describe('Integration with other operations', () => {
    it('should handle chained operations', async () => {
      // Encode to base64, then decode back
      const encodeResult = await Processor.processText(sampleText, 'encode', { encoding: 'base64' });
      expect(encodeResult.success).toBe(true);

      const decodeResult = await Processor.processText(encodeResult.result, 'decode', { encoding: 'base64' });
      expect(decodeResult.success).toBe(true);
      expect(decodeResult.result).toBe(sampleText);
    });

    it('should handle multiple format operations', async () => {
      const text = '   hello world test   ';

      const step1 = await Processor.processText(text, 'format', { trim: true });
      expect(step1.success).toBe(true);
      expect(step1.result).toBe('hello world test');

      const step2 = await Processor.processText(step1.result, 'format', { caseType: 'upper' });
      expect(step2.success).toBe(true);
      expect(step2.result).toBe('HELLO WORLD TEST');

      const step3 = await Processor.processText(step2.result, 'transform', {
        find: 'HELLO',
        replace: 'HI'
      });
      expect(step3.success).toBe(true);
      expect(step3.result).toBe('HI WORLD TEST');
    });
  });
});
