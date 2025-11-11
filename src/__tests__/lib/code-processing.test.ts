/**
 * Comprehensive unit tests for code processing utilities
 * Tests code execution, formatting, validation, and transformation functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  executeCode,
  validateSyntax,
  formatCode,
  minifyCode,
  extractImports,
  findSecurityIssues,
  sanitizeCode,
  detectLanguage,
  parseRegex,
  testRegex,
  generateRegex
} from '@/lib/code-processing';
import fixtures from '../fixtures/tools-fixtures';

describe('Code Processing Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeCode', () => {
    it('should execute JavaScript code safely', async () => {
      const code = fixtures.code.javascript.simple;
      const result = await executeCode(code, 'javascript');

      expect(result.success).toBe(true);
      expect(result.output).toContain('Hello, World!');
      expect(result.error).toBeNull();
    });

    it('should execute Python code safely', async () => {
      const code = fixtures.code.python.simple;
      const result = await executeCode(code, 'python');

      expect(result.success).toBe(true);
      expect(result.output).toContain('Hello, World!');
      expect(result.error).toBeNull();
    });

    it('should handle async JavaScript code', async () => {
      const code = fixtures.code.javascript.async;
      const result = await executeCode(code, 'javascript');

      expect(result.success).toBe(true);
      expect(result.output).toContain('Data loaded');
    });

    it('should handle code errors gracefully', async () => {
      const code = fixtures.code.javascript.error;
      const result = await executeCode(code, 'javascript');

      expect(result.success).toBe(false);
      expect(result.output).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Test error');
    });

    it('should enforce execution timeout', async () => {
      const infiniteLoopCode = `
        while (true) {
          // Infinite loop
        }
      `;

      const startTime = Date.now();
      const result = await executeCode(infiniteLoopCode, 'javascript', { timeout: 1000 });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000); // Should timeout within 1s + buffer
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('timeout');
    });

    it('should capture console output', async () => {
      const code = `
        console.log('Direct output');
        console.error('Error output');
        console.warn('Warning output');
      `;

      const result = await executeCode(code, 'javascript');

      expect(result.success).toBe(true);
      expect(result.output).toContain('Direct output');
      expect(result.output).toContain('Error output');
      expect(result.output).toContain('Warning output');
    });

    it('should handle return values', async () => {
      const code = `
        function add(a, b) {
          return a + b;
        }

        const result = add(5, 3);
        result; // Return this value
      `;

      const result = await executeCode(code, 'javascript');

      expect(result.success).toBe(true);
      expect(result.returnValue).toBe(8);
    });
  });

  describe('validateSyntax', () => {
    it('should validate correct JavaScript syntax', () => {
      const validCode = fixtures.code.javascript.function;
      const result = validateSyntax(validCode, 'javascript');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
      expect(result.line).toBeUndefined();
      expect(result.column).toBeUndefined();
    });

    it('should detect JavaScript syntax errors', () => {
      const invalidCode = `
        function test() {
          console.log('missing closing brace'
        }
      `;

      const result = validateSyntax(invalidCode, 'javascript');

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.line).toBeDefined();
      expect(result.column).toBeDefined();
    });

    it('should validate correct Python syntax', () => {
      const validCode = fixtures.code.python.function;
      const result = validateSyntax(validCode, 'python');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should detect Python syntax errors', () => {
      const invalidCode = `
        def test()
          print("missing colon")
      `;

      const result = validateSyntax(invalidCode, 'python');

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle empty and null inputs', () => {
      expect(validateSyntax('', 'javascript').isValid).toBe(true);
      expect(validateSyntax(null as any, 'javascript').isValid).toBe(false);
      expect(validateSyntax(undefined as any, 'javascript').isValid).toBe(false);
    });
  });

  describe('formatCode', () => {
    it('should format JavaScript code with default settings', () => {
      const unformattedCode = 'function test(){return 1+2;}';
      const result = formatCode(unformattedCode, 'javascript');

      expect(result).toContain('function test()');
      expect(result).toContain('return 1 + 2');
      expect(result.split('\n').length).toBeGreaterThan(1);
    });

    it('should format Python code with proper indentation', () => {
      const unformattedCode = 'def test():\nreturn 1+2';
      const result = formatCode(unformattedCode, 'python');

      expect(result).toContain('def test():');
      expect(result.split('\n')[1]).toMatch(/^\s+return/); // Should be indented
    });

    it('should respect custom formatting options', () => {
      const code = 'function test(){const x=1;return x;}';

      const result2 = formatCode(code, 'javascript', {
        indentSize: 2,
        useSemicolons: true
      });

      const result4 = formatCode(code, 'javascript', {
        indentSize: 4,
        useSemicolons: false
      });

      expect(result2).toContain('  ');
      expect(result4).toContain('    ');
    });

    it('should handle complex code structures', () => {
      const complexCode = `
        class TestClass {
          constructor() { this.value = 0; }
          getValue() { return this.value; }
          setValue(value) { this.value = value; }
        }

        const test = new TestClass();
        test.setValue(42);
      `;

      const result = formatCode(complexCode, 'javascript');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should preserve comments', () => {
      const codeWithComments = `
        // This is a comment
        function test() {
          /* Multi-line comment */
          return 42; // End of line comment
        }
      `;

      const result = formatCode(codeWithComments, 'javascript');
      expect(result).toContain('This is a comment');
      expect(result).toContain('Multi-line comment');
      expect(result).toContain('End of line comment');
    });
  });

  describe('minifyCode', () => {
    it('should remove unnecessary whitespace', () => {
      const code = `
        function test() {
          const x = 1;
          const y = 2;
          return x + y;
        }
      `;

      const result = minifyCode(code, 'javascript');

      // Should remove extra whitespace and newlines
      expect(result).not.toContain('\n');
      expect(result).not.toContain('  ');
      expect(result.length).toBeLessThan(code.length);
    });

    it('should remove comments', () => {
      const codeWithComments = `
        // Single line comment
        function test() {
          /* Multi-line comment */
          return 42; // End of line comment
        }
      `;

      const result = minifyCode(codeWithComments, 'javascript');

      expect(result).not.toContain('Single line comment');
      expect(result).not.toContain('Multi-line comment');
      expect(result).not.toContain('End of line comment');
    });

    it('should handle different languages', () => {
      const jsCode = 'function test() { return 42; }';
      const pyCode = 'def test():\n    return 42';

      const jsResult = minifyCode(jsCode, 'javascript');
      const pyResult = minifyCode(pyCode, 'python');

      expect(jsResult.length).toBeLessThanOrEqual(jsCode.length);
      expect(pyResult.length).toBeLessThanOrEqual(pyCode.length);
    });
  });

  describe('extractImports', () => {
    it('should extract ES6 imports', () => {
      const code = `
        import React from 'react';
        import { useState, useEffect } from 'react';
        import * as utils from './utils';
        import type { TestType } from './types';
      `;

      const result = extractImports(code, 'javascript');

      expect(result).toHaveLength(4);
      expect(result[0]).toMatchObject({
        type: 'default',
        name: 'React',
        source: 'react'
      });
      expect(result[1]).toMatchObject({
        type: 'named',
        names: ['useState', 'useEffect'],
        source: 'react'
      });
    });

    it('should extract CommonJS imports', () => {
      const code = `
        const React = require('react');
        const { useState, useEffect } = require('react');
        const utils = require('./utils');
      `;

      const result = extractImports(code, 'javascript');

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        type: 'commonjs',
        name: 'React',
        source: 'react'
      });
    });

    it('should extract Python imports', () => {
      const code = `
        import os
        import sys
        from typing import List, Dict
        from utils import helper, validator
        from .local_module import local_function
      `;

      const result = extractImports(code, 'python');

      expect(result).toHaveLength(5);
      expect(result[0]).toMatchObject({
        type: 'import',
        name: 'os'
      });
      expect(result[2]).toMatchObject({
        type: 'from',
        source: 'typing',
        names: ['List', 'Dict']
      });
    });
  });

  describe('findSecurityIssues', () => {
    it('should detect dangerous functions', () => {
      const dangerousCode = `
        eval('malicious code');
        setTimeout('dangerous timeout');
        setInterval('dangerous interval');
      `;

      const result = findSecurityIssues(dangerousCode, 'javascript');

      expect(result.issues).toHaveLength(3);
      expect(result.issues[0]).toMatchObject({
        type: 'dangerous-function',
        severity: 'high',
        function: 'eval'
      });
    });

    it('should detect suspicious patterns', () => {
      const suspiciousCode = `
        const code = req.body.code;
        eval(code);

        const script = '<script>alert("xss")</script>';
        document.body.innerHTML = script;
      `;

      const result = findSecurityIssues(suspiciousCode, 'javascript');

      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some(issue =>
        issue.type === 'code-injection'
      )).toBe(true);
      expect(result.issues.some(issue =>
        issue.type === 'xss'
      )).toBe(true);
    });

    it('should detect hardcoded secrets', () => {
      const codeWithSecrets = `
        const API_KEY = 'sk-1234567890abcdef';
        const password = 'supersecretpassword123';
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      `;

      const result = findSecurityIssues(codeWithSecrets, 'javascript');

      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some(issue =>
        issue.type === 'hardcoded-secret'
      )).toBe(true);
    });

    it('should calculate risk score', () => {
      const safeCode = `
        function add(a, b) {
          return a + b;
        }
      `;

      const dangerousCode = `
        eval(req.body.code);
        document.innerHTML = userInput;
        const API_KEY = 'secret-key';
      `;

      const safeResult = findSecurityIssues(safeCode, 'javascript');
      const dangerousResult = findSecurityIssues(dangerousCode, 'javascript');

      expect(safeResult.riskScore).toBeLessThan(dangerousResult.riskScore);
      expect(safeResult.riskLevel).toBe('low');
      expect(dangerousResult.riskLevel).toBe('high');
    });
  });

  describe('sanitizeCode', () => {
    it('should remove dangerous functions', () => {
      const dangerousCode = `
        eval('malicious');
        setTimeout('timeout');
        Function('constructor')('dangerous');
      `;

      const result = sanitizeCode(dangerousCode, 'javascript');

      expect(result).not.toContain('eval');
      expect(result).not.toContain('setTimeout');
      expect(result).not.toContain('Function');
    });

    it('should preserve safe functionality', () => {
      const safeCode = `
        function add(a, b) {
          return a + b;
        }

        const result = add(5, 3);
        console.log(result);
      `;

      const result = sanitizeCode(safeCode, 'javascript');

      expect(result).toContain('function add');
      expect(result).toContain('console.log');
      expect(result).toContain('return a + b');
    });

    it('should handle different sanitization levels', () => {
      const code = `
        eval('code');
        setTimeout(() => {}, 1000);
        console.log('hello');
      `;

      const strictResult = sanitizeCode(code, 'javascript', { level: 'strict' });
      const moderateResult = sanitizeCode(code, 'javascript', { level: 'moderate' });

      expect(strictResult).not.toContain('eval');
      expect(strictResult).not.toContain('setTimeout');

      expect(moderateResult).not.toContain('eval');
      // Moderate level might allow some functions
    });
  });

  describe('detectLanguage', () => {
    it('should detect JavaScript correctly', () => {
      const jsCode = `
        function test() {
          const x = 1;
          return x;
        }

        const arr = [1, 2, 3];
        arr.forEach(item => console.log(item));
      `;

      const result = detectLanguage(jsCode);
      expect(result.language).toBe('javascript');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should detect Python correctly', () => {
      const pyCode = `
        def test():
            x = 1
            return x

        arr = [1, 2, 3]
        for item in arr:
            print(item)
      `;

      const result = detectLanguage(pyCode);
      expect(result.language).toBe('python');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should detect TypeScript correctly', () => {
      const tsCode = `
        interface User {
          name: string;
          age: number;
        }

        function greet(user: User): string {
          return \`Hello, \${user.name}!\`;
        }
      `;

      const result = detectLanguage(tsCode);
      expect(result.language).toBe('typescript');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should handle ambiguous code', () => {
      const ambiguousCode = 'print("hello")';

      const result = detectLanguage(ambiguousCode);
      expect(result.confidence).toBeLessThan(0.8);
      expect(result.alternatives).toContain('python');
    });
  });

  describe('parseRegex', () => {
    it('should parse simple regex patterns', () => {
      const patterns = [
        fixtures.code.regex.email,
        fixtures.code.regex.phone,
        fixtures.code.regex.url,
      ];

      patterns.forEach(pattern => {
        const result = parseRegex(pattern);
        expect(result.isValid).toBe(true);
        expect(result.pattern).toBe(pattern);
        expect(result.flags).toBeDefined();
        expect(result.groups).toBeDefined();
      });
    });

    it('should extract regex groups', () => {
      const pattern = /(https?):\/\/(www\.)?([^\/]+)/;
      const result = parseRegex(pattern);

      expect(result.groups).toHaveLength(3);
      expect(result.groups[0]).toBe('https?');
      expect(result.groups[1]).toBe('www\\.');
      expect(result.groups[2]).toBe('([^\\/]+)');
    });

    it('should detect invalid regex patterns', () => {
      const invalidPatterns = [
        '(', // Unclosed group
        '[', // Unclosed character class
        '*', // Invalid quantifier
        ')', // Unmatched closing parenthesis
      ];

      invalidPatterns.forEach(pattern => {
        const result = parseRegex(pattern);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should handle regex flags', () => {
      const pattern = /test/gi;
      const result = parseRegex(pattern);

      expect(result.flags).toContain('g');
      expect(result.flags).toContain('i');
    });
  });

  describe('testRegex', () => {
    it('should test regex against text', () => {
      const email = fixtures.code.regex.email;
      const testCases = [
        { text: 'test@example.com', expected: true },
        { text: 'invalid-email', expected: false },
        { text: 'user.name+tag@domain.co.uk', expected: true },
      ];

      testCases.forEach(({ text, expected }) => {
        const result = testRegex(email, text);
        expect(result.matches).toBe(expected);

        if (expected) {
          expect(result.matches[0]).toBe(text); // Full match
        }
      });
    });

    it('should provide detailed match information', () => {
      const pattern = /(\\d{3})-(\\d{3})-(\\d{4})/;
      const text = 'Phone: 555-123-4567';

      const result = testRegex(pattern, text);

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0]).toBe('555-123-4567');
      expect(result.groups).toHaveLength(4); // Full match + 3 groups
      expect(result.groups[1]).toBe('555');
      expect(result.groups[2]).toBe('123');
      expect(result.groups[3]).toBe('4567');
    });

    it('should handle global regex flag', () => {
      const pattern = /\\d+/g;
      const text = 'Numbers: 1, 23, 456';

      const result = testRegex(pattern, text);

      expect(result.matches).toHaveLength(3);
      expect(result.matches).toEqual(['1', '23', '456']);
    });

    it('should handle test cases with expected results', () => {
      const testCases = [
        { text: 'test@example.com', expected: true },
        { text: 'invalid-email', expected: false },
        { text: 'another@test.co.uk', expected: true },
      ];

      const result = testRegex(fixtures.code.regex.email, testCases);

      expect(result.passed).toBe(2); // 2 out of 3 should pass
      expect(result.failed).toBe(1);
      expect(result.results).toHaveLength(3);
    });
  });

  describe('generateRegex', () => {
    it('should generate email regex', () => {
      const options = {
        allowInternational: false,
        allowPlusSign: true,
      };

      const result = generateRegex('email', options);

      expect(result.pattern).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.examples).toBeDefined();
      expect(result.testCases).toBeDefined();
    });

    it('should generate phone regex for different regions', () => {
      const usOptions = { region: 'US', format: 'national' };
      const ukOptions = { region: 'UK', format: 'international' };

      const usResult = generateRegex('phone', usOptions);
      const ukResult = generateRegex('phone', ukOptions);

      expect(usResult.pattern).toBeDefined();
      expect(ukResult.pattern).toBeDefined();
      expect(usResult.pattern).not.toBe(ukResult.pattern);
    });

    it('should generate custom regex from description', () => {
      const description = 'A password that is 8-16 characters long, contains at least one uppercase letter, one lowercase letter, one number, and one special character';

      const result = generateRegex('custom', { description });

      expect(result.pattern).toBeDefined();
      expect(result.description).toBe(description);
      expect(result.isValid).toBe(true);
    });

    it('should provide test cases for generated regex', () => {
      const result = generateRegex('email');

      expect(result.testCases.positive).toBeDefined();
      expect(result.testCases.negative).toBeDefined();
      expect(result.testCases.positive.length).toBeGreaterThan(0);
      expect(result.testCases.negative.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large code files efficiently', () => {
      const largeCode = `
        ${Array.from({ length: 1000 }, (_, i) => `
          function function${i}() {
            const variable${i} = ${i};
            return variable${i} * 2;
          }
        `).join('\n')}
      `;

      const startTime = performance.now();
      const result = validateSyntax(largeCode, 'javascript');
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000);
      expect(result.isValid).toBe(true);
    });

    it('should format large code quickly', () => {
      const largeCode = `
        function test() {
          ${Array.from({ length: 500 }, (_, i) => `
            const var${i} = ${i};
            if (var${i} > 0) {
              console.log(var${i});
            }
          `).join('\n')}
        }
      `;

      const startTime = performance.now();
      const result = formatCode(largeCode, 'javascript');
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(duration).toBeLessThan(3000);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
