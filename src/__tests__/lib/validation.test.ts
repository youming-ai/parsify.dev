import {
  sanitizeInput,
  validateEmail,
  validateJson,
  validateMinLength,
  validatePassword,
  validateRequired,
} from '@/lib/utils/validation';
import { describe, expect, it } from 'vitest';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should return true for valid emails', () => {
      expect(validateEmail.validate('test@example.com')).toBe(true);
      expect(validateEmail.validate('user.name@domain.co.uk')).toBe(true);
    });

    it('should return error message for invalid emails', () => {
      expect(typeof validateEmail.validate('invalid-email')).toBe('string');
      expect(typeof validateEmail.validate('test@')).toBe('string');
      expect(typeof validateEmail.validate('@domain.com')).toBe('string');
    });

    it('should return true for empty optional field', () => {
      expect(validateEmail.validate('')).toBe(true);
    });
  });

  describe('validateJson', () => {
    it('should return true for valid JSON', () => {
      expect(validateJson.validate('{"key": "value"}')).toBe(true);
      expect(validateJson.validate('[1, 2, 3]')).toBe(true);
      expect(validateJson.validate('"string"')).toBe(true);
    });

    it('should return error message for invalid JSON', () => {
      expect(typeof validateJson.validate('{key: "value"}')).toBe('string');
      expect(typeof validateJson.validate('{"key": "value"')).toBe('string');
    });
  });

  describe('validateRequired', () => {
    it('should return true for non-empty values', () => {
      expect(validateRequired.validate('content')).toBe(true);
      expect(validateRequired.validate(123)).toBe(true);
      expect(validateRequired.validate(false)).toBe(true);
    });

    it('should return error message for empty values', () => {
      expect(typeof validateRequired.validate('')).toBe('string');
      expect(typeof validateRequired.validate('   ')).toBe('string');
      expect(typeof validateRequired.validate(null)).toBe('string');
      expect(typeof validateRequired.validate(undefined)).toBe('string');
    });
  });

  describe('validateMinLength', () => {
    it('should work correctly with specified length', () => {
      const min5 = validateMinLength(5);
      expect(min5.validate('12345')).toBe(true);
      expect(min5.validate('123456')).toBe(true);
      expect(typeof min5.validate('1234')).toBe('string');
    });
  });

  describe('validatePassword', () => {
    it('should return true for strong passwords', () => {
      expect(validatePassword.validate('StrongP@ss123')).toBe(true);
    });

    it('should fail for weak passwords', () => {
      expect(typeof validatePassword.validate('weak')).toBe('string');
      expect(typeof validatePassword.validate('alllowercase123!')).toBe('string');
      expect(typeof validatePassword.validate('NoSpecialChar123')).toBe('string');
    });
  });

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
      expect(sanitizeInput('<div>Hello</div>')).toBe('divHello/div');
    });

    it('should remove dangerous protocols', () => {
      expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
    });

    it('should remove event handlers', () => {
      expect(sanitizeInput('img src=x onerror=alert(1)')).toBe('img src=x alert(1)');
    });
  });
});
