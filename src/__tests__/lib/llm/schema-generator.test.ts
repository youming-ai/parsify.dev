import { generateSchemaFromJson } from '@/lib/llm/schema-generator';
import { describe, expect, it } from 'vitest';

describe('generateSchemaFromJson', () => {
  it('generates object schema with required fields', () => {
    const result = generateSchemaFromJson({ name: 'Alice', age: 30 });
    const schema = result.schema as Record<string, unknown>;
    expect(schema.type).toBe('object');
    expect(schema.additionalProperties).toBe(false);
    expect(Array.isArray(schema.required)).toBe(true);
    const properties = schema.properties as Record<string, unknown>;
    expect(properties.name).toEqual({ type: 'string' });
    expect(properties.age).toEqual({ type: 'integer' });
  });

  it('generates array schema with item types', () => {
    const result = generateSchemaFromJson([1, 2, 3]);
    const schema = result.schema as Record<string, unknown>;
    expect(schema.type).toBe('array');
    expect(schema.items).toEqual({ type: 'integer' });
  });

  it('warns on mixed array types', () => {
    const result = generateSchemaFromJson([1, 'two', true]);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]?.message).toContain('Mixed types');
  });

  it('handles nested objects', () => {
    const result = generateSchemaFromJson({ user: { name: 'Bob' } });
    const schema = result.schema as Record<string, unknown>;
    const properties = schema.properties as Record<string, unknown>;
    const userSchema = properties.user as Record<string, unknown>;
    expect(userSchema.type).toBe('object');
    const userProps = userSchema.properties as Record<string, unknown>;
    expect(userProps.name).toEqual({ type: 'string' });
  });

  it('handles null values', () => {
    const result = generateSchemaFromJson(null);
    expect(result.schema).toEqual({ type: 'null' });
  });

  it('handles boolean and number types', () => {
    const result = generateSchemaFromJson({ active: true, score: 1.5 });
    const properties = (result.schema as Record<string, unknown>).properties as Record<
      string,
      unknown
    >;
    expect(properties.active).toEqual({ type: 'boolean' });
    expect(properties.score).toEqual({ type: 'number' });
  });
});
