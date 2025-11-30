/**
 * Shared validation utilities and rules
 * Provides common validation functions and rules for form inputs and data
 */

import { REGEX_PATTERNS } from '@/lib/constants';
import type { ValidationRule } from '@/types/components';

/**
 * Email validation
 */
export const validateEmail: ValidationRule = {
  name: 'email',
  validate: (value: string) => {
    if (!value) return true; // Optional field
    return REGEX_PATTERNS.EMAIL.test(value) || 'Please enter a valid email address';
  },
  message: 'Invalid email format',
};

/**
 * URL validation
 */
export const validateUrl: ValidationRule = {
  name: 'url',
  validate: (value: string) => {
    if (!value) return true; // Optional field
    return REGEX_PATTERNS.URL.test(value) || 'Please enter a valid URL';
  },
  message: 'Invalid URL format',
};

/**
 * Phone number validation
 */
export const validatePhone: ValidationRule = {
  name: 'phone',
  validate: (value: string) => {
    if (!value) return true; // Optional field
    return REGEX_PATTERNS.PHONE.test(value) || 'Please enter a valid phone number';
  },
  message: 'Invalid phone number format',
};

/**
 * JSON validation
 */
export const validateJson: ValidationRule = {
  name: 'json',
  validate: (value: string) => {
    if (!value) return true; // Optional field
    try {
      JSON.parse(value);
      return true;
    } catch {
      return 'Please enter valid JSON';
    }
  },
  message: 'Invalid JSON format',
};

/**
 * Hex color validation
 */
export const validateHexColor: ValidationRule = {
  name: 'hexColor',
  validate: (value: string) => {
    if (!value) return true; // Optional field
    return REGEX_PATTERNS.HEX_COLOR.test(value) || 'Please enter a valid hex color';
  },
  message: 'Invalid hex color format',
};

/**
 * IPv4 address validation
 */
export const validateIPv4: ValidationRule = {
  name: 'ipv4',
  validate: (value: string) => {
    if (!value) return true; // Optional field
    return REGEX_PATTERNS.IPV4.test(value) || 'Please enter a valid IPv4 address';
  },
  message: 'Invalid IPv4 address format',
};

/**
 * UUID validation
 */
export const validateUUID: ValidationRule = {
  name: 'uuid',
  validate: (value: string) => {
    if (!value) return true; // Optional field
    return REGEX_PATTERNS.UUID.test(value) || 'Please enter a valid UUID';
  },
  message: 'Invalid UUID format',
};

/**
 * Required field validation
 */
export const validateRequired: ValidationRule = {
  name: 'required',
  validate: (value: any) => {
    if (typeof value === 'string') {
      return value.trim().length > 0 || 'This field is required';
    }
    return (value !== null && value !== undefined) || 'This field is required';
  },
  message: 'This field is required',
  required: true,
};

/**
 * Minimum length validation
 */
export const validateMinLength = (minLength: number): ValidationRule => ({
  name: 'minLength',
  validate: (value: string) => {
    if (!value) return true; // Optional field
    return value.length >= minLength || `Minimum ${minLength} characters required`;
  },
  message: `Minimum ${minLength} characters required`,
});

/**
 * Maximum length validation
 */
export const validateMaxLength = (maxLength: number): ValidationRule => ({
  name: 'maxLength',
  validate: (value: string) => {
    if (!value) return true; // Optional field
    return value.length <= maxLength || `Maximum ${maxLength} characters allowed`;
  },
  message: `Maximum ${maxLength} characters allowed`,
});

/**
 * Number range validation
 */
export const validateNumberRange = (min: number, max: number): ValidationRule => ({
  name: 'numberRange',
  validate: (value: number) => {
    if (value === null || value === undefined) return true; // Optional field
    return (value >= min && value <= max) || `Value must be between ${min} and ${max}`;
  },
  message: `Value must be between ${min} and ${max}`,
});

/**
 * File size validation
 */
export const validateFileSize = (maxSize: number): ValidationRule => ({
  name: 'fileSize',
  validate: (file: File) => {
    if (!file) return true; // Optional field
    return (
      file.size <= maxSize || `File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`
    );
  },
  message: 'File size too large',
});

/**
 * File type validation
 */
export const validateFileType = (allowedTypes: string[]): ValidationRule => ({
  name: 'fileType',
  validate: (file: File) => {
    if (!file) return true; // Optional field
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    return (
      (fileExtension && allowedTypes.includes(fileExtension)) ||
      `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
    );
  },
  message: 'Invalid file type',
});

/**
 * Password strength validation
 */
export const validatePassword: ValidationRule = {
  name: 'password',
  validate: (value: string) => {
    if (!value) return true; // Optional field

    const checks = [
      { regex: /.{8,}/, message: 'at least 8 characters' },
      { regex: /[A-Z]/, message: 'uppercase letter' },
      { regex: /[a-z]/, message: 'lowercase letter' },
      { regex: /\d/, message: 'number' },
      { regex: /[!@#$%^&*(),.?":{}|<>]/, message: 'special character' },
    ];

    const failed = checks.filter((check) => !check.regex.test(value));

    if (failed.length === 0) return true;

    return `Password must contain ${failed.map((f) => f.message).join(', ')}`;
  },
  message: 'Password does not meet strength requirements',
};

/**
 * Date validation
 */
export const validateDate: ValidationRule = {
  name: 'date',
  validate: (value: string) => {
    if (!value) return true; // Optional field
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) || 'Please enter a valid date';
  },
  message: 'Invalid date format',
};

/**
 * Positive number validation
 */
export const validatePositiveNumber: ValidationRule = {
  name: 'positiveNumber',
  validate: (value: number) => {
    if (value === null || value === undefined) return true; // Optional field
    return value > 0 || 'Value must be positive';
  },
  message: 'Value must be positive',
};

/**
 * Integer validation
 */
export const validateInteger: ValidationRule = {
  name: 'integer',
  validate: (value: number) => {
    if (value === null || value === undefined) return true; // Optional field
    return Number.isInteger(value) || 'Value must be an integer';
  },
  message: 'Value must be an integer',
};

/**
 * Regex pattern validation
 */
export const validatePattern = (pattern: RegExp, message?: string): ValidationRule => ({
  name: 'pattern',
  validate: (value: string) => {
    if (!value) return true; // Optional field
    return pattern.test(value) || message || 'Invalid format';
  },
  message: message || 'Invalid format',
});

/**
 * Custom function validation
 */
export const validateCustom = (
  validator: (value: any) => boolean | string,
  message: string
): ValidationRule => ({
  name: 'custom',
  validate: validator,
  message,
});

/**
 * Validate multiple rules and return all errors
 */
export const validateRules = (
  value: any,
  rules: ValidationRule[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  for (const rule of rules) {
    const result = rule.validate(value);
    if (result !== true) {
      const message = typeof result === 'string' ? result : rule.message || 'Invalid value';
      errors.push(message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate object properties with rules
 */
export const validateObject = (
  obj: Record<string, any>,
  rules: Record<string, ValidationRule[]>
): { isValid: boolean; errors: Record<string, string[]> } => {
  const errors: Record<string, string[]> = {};
  let isValid = true;

  for (const [key, fieldRules] of Object.entries(rules)) {
    const value = obj[key];
    const result = validateRules(value, fieldRules);

    if (!result.isValid) {
      errors[key] = result.errors;
      isValid = false;
    }
  }

  return { isValid, errors };
};

/**
 * File validation helper
 */
export const validateFile = (
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    required?: boolean;
  }
): { isValid: boolean; errors: string[] } => {
  const rules: ValidationRule[] = [];

  if (options.required) {
    rules.push(validateRequired);
  }

  if (options.maxSize) {
    rules.push(validateFileSize(options.maxSize));
  }

  if (options.allowedTypes) {
    rules.push(validateFileType(options.allowedTypes));
  }

  return validateRules(file, rules);
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validate and sanitize multiple inputs
 */
export const validateAndSanitize = (
  inputs: Record<string, string>,
  rules: Record<string, ValidationRule[]>
): {
  isValid: boolean;
  errors: Record<string, string[]>;
  sanitized: Record<string, string>;
} => {
  const sanitized: Record<string, string> = {};
  const errors: Record<string, string[]> = {};
  let isValid = true;

  for (const [key, value] of Object.entries(inputs)) {
    // Sanitize input
    sanitized[key] = sanitizeInput(value);

    // Validate if rules exist
    if (rules[key]) {
      const result = validateRules(sanitized[key], rules[key]);
      if (!result.isValid) {
        errors[key] = result.errors;
        isValid = false;
      }
    }
  }

  return { isValid, errors, sanitized };
};

/**
 * Async validation helper
 */
export const validateAsync = async (
  value: any,
  asyncValidators: Array<{
    validate: (value: any) => Promise<boolean | string>;
    message: string;
  }>
): Promise<{ isValid: boolean; errors: string[] }> => {
  const errors: string[] = [];

  for (const validator of asyncValidators) {
    const result = await validator.validate(value);
    if (result !== true) {
      const message = typeof result === 'string' ? result : validator.message || 'Invalid value';
      errors.push(message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
