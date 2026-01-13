import { describe, expect, it } from 'vitest';
import { JSONValidator, validateJSON } from '../../lib/json/json-validator';

describe('validateJSON', () => {
  describe('basic validation', () => {
    it('validates valid JSON', () => {
      const result = validateJSON('{"name": "test", "value": 123}');
      expect(result.isValid).toBe(true);
      expect(result.hasErrors).toBe(false);
    });

    it('validates valid JSON array', () => {
      const result = validateJSON('[1, 2, 3]');
      expect(result.isValid).toBe(true);
      expect(result.hasErrors).toBe(false);
    });

    it('returns error for invalid JSON', () => {
      const result = validateJSON('{invalid}');
      expect(result.isValid).toBe(false);
      expect(result.hasErrors).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns error for empty string', () => {
      const result = validateJSON('');
      expect(result.isValid).toBe(false);
      expect(result.hasErrors).toBe(true);
    });

    it('handles null value', () => {
      const result = validateJSON('null');
      expect(result.isValid).toBe(true);
    });

    it('handles boolean values', () => {
      expect(validateJSON('true').isValid).toBe(true);
      expect(validateJSON('false').isValid).toBe(true);
    });

    it('handles number values', () => {
      expect(validateJSON('42').isValid).toBe(true);
      expect(validateJSON('-3.14').isValid).toBe(true);
      expect(validateJSON('1e10').isValid).toBe(true);
    });
  });

  describe('performance metadata', () => {
    it('includes performance metrics', () => {
      const result = validateJSON('{"test": true}');
      expect(result.performance).toBeDefined();
      expect(result.performance.parseTime).toBeGreaterThanOrEqual(0);
      expect(result.performance.totalTime).toBeGreaterThanOrEqual(0);
      expect(result.performance.linesProcessed).toBe(1);
    });

    it('includes metadata', () => {
      const result = validateJSON('{"test": true}');
      expect(result.metadata).toBeDefined();
      expect(result.metadata.version).toBe('1.0.0');
      expect(result.metadata.inputType).toBe('json');
    });
  });
});

describe('JSONValidator class', () => {
  it('can be instantiated with default options', () => {
    const validator = new JSONValidator();
    const options = validator.getOptions();
    expect(options.strictMode).toBe(false);
    expect(options.maxDepth).toBe(10);
  });

  it('can be instantiated with custom options', () => {
    const validator = new JSONValidator({ maxDepth: 5, strictMode: true });
    const options = validator.getOptions();
    expect(options.maxDepth).toBe(5);
    expect(options.strictMode).toBe(true);
  });

  it('can update options', () => {
    const validator = new JSONValidator();
    validator.updateOptions({ maxDepth: 20 });
    expect(validator.getOptions().maxDepth).toBe(20);
  });

  describe('relaxed parsing', () => {
    it('handles trailing commas when allowed', () => {
      const validator = new JSONValidator({ allowTrailingCommas: true });
      const result = validator.validate('{"a": 1,}');
      expect(result.isValid).toBe(true);
    });

    it('handles comments when allowed', () => {
      const validator = new JSONValidator({ allowComments: true });
      const result = validator.validate('{"a": 1 /* comment */}');
      expect(result.isValid).toBe(true);
    });

    it('handles single quotes when allowed', () => {
      const validator = new JSONValidator({ allowSingleQuotes: true });
      const result = validator.validate("{'a': 1}");
      expect(result.isValid).toBe(true);
    });
  });

  describe('custom rules', () => {
    it('can add custom rules', () => {
      const validator = new JSONValidator();
      validator.addRule({
        name: 'test-rule',
        description: 'Test rule',
        severity: 'warning',
        enabled: true,
        validate: () => [],
      });
      const rules = validator.getRules();
      expect(rules.find((r) => r.name === 'test-rule')).toBeDefined();
    });

    it('can remove rules', () => {
      const validator = new JSONValidator();
      validator.addRule({
        name: 'removable-rule',
        description: 'Test',
        severity: 'warning',
        enabled: true,
        validate: () => [],
      });
      expect(validator.removeRule('removable-rule')).toBe(true);
      expect(validator.removeRule('non-existent')).toBe(false);
    });

    it('can enable/disable rules', () => {
      const validator = new JSONValidator();
      validator.addRule({
        name: 'toggle-rule',
        description: 'Test',
        severity: 'warning',
        enabled: true,
        validate: () => [],
      });
      expect(validator.setRuleEnabled('toggle-rule', false)).toBe(true);
      const rule = validator.getRules().find((r) => r.name === 'toggle-rule');
      expect(rule?.enabled).toBe(false);
    });
  });
});
