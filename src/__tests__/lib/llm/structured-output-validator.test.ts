import {
  stripMarkdownCodeFence,
  validateStructuredOutput,
} from '@/lib/llm/structured-output-validator';
import { describe, expect, it } from 'vitest';

describe('stripMarkdownCodeFence', () => {
  it('strips markdown json fences', () => {
    const wrapped = '```json\n{"ok": true}\n```';
    expect(stripMarkdownCodeFence(wrapped)).toBe('{"ok": true}');
  });

  it('returns plain json unchanged', () => {
    const plain = '{"ok": true}';
    expect(stripMarkdownCodeFence(plain)).toBe('{"ok": true}');
  });

  it('strips generic code fences', () => {
    const wrapped = '```\n[1, 2, 3]\n```';
    expect(stripMarkdownCodeFence(wrapped)).toBe('[1, 2, 3]');
  });
});

describe('validateStructuredOutput', () => {
  it('validates object against schema', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
      required: ['name'],
      additionalProperties: false,
    };
    const result = validateStructuredOutput('{"name":"Alice"}', schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('reports missing required field', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
      required: ['name'],
      additionalProperties: false,
    };
    const result = validateStructuredOutput('{}', schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('Missing required'))).toBe(true);
  });

  it('reports additional properties when disallowed', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
      required: ['name'],
      additionalProperties: false,
    };
    const result = validateStructuredOutput('{"name":"Alice","age":30}', schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('Additional property'))).toBe(true);
  });

  it('reports type mismatch', () => {
    const schema = { type: 'object', properties: { count: { type: 'integer' } } };
    const result = validateStructuredOutput('{"count":"ten"}', schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('Expected integer'))).toBe(true);
  });

  it('reports invalid json', () => {
    const result = validateStructuredOutput('not json', { type: 'string' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.path).toBe('#');
  });

  it('validates enum values', () => {
    const schema = { type: 'string', enum: ['a', 'b', 'c'] };
    expect(validateStructuredOutput('"a"', schema).valid).toBe(true);
    expect(validateStructuredOutput('"z"', schema).valid).toBe(false);
  });

  it('validates arrays', () => {
    const schema = { type: 'array', items: { type: 'integer' } };
    const result = validateStructuredOutput('[1, 2, 3]', schema);
    expect(result.valid).toBe(true);

    const bad = validateStructuredOutput('[1, "two", 3]', schema);
    expect(bad.valid).toBe(false);
  });
});
