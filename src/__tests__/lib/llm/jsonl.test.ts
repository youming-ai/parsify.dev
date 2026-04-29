import { parseJsonl, serializeJsonl, updateJsonlRecord } from '@/lib/llm/jsonl';
import { describe, expect, it } from 'vitest';

describe('parseJsonl', () => {
  it('parses valid lines', () => {
    const result = parseJsonl('{"a":1}\n{"b":2}');
    expect(result.records).toHaveLength(2);
    expect(result.validCount).toBe(2);
    expect(result.invalidCount).toBe(0);
    expect(result.fieldSummary).toHaveProperty('a');
    expect(result.fieldSummary).toHaveProperty('b');
  });

  it('counts invalid lines', () => {
    const result = parseJsonl('bad json');
    expect(result.invalidCount).toBe(1);
    expect(result.records[0]?.valid).toBe(false);
  });

  it('skips blank lines', () => {
    const result = parseJsonl('{"a":1}\n\n{"b":2}');
    expect(result.records).toHaveLength(2);
  });

  it('summarizes field types', () => {
    const result = parseJsonl('{"x":1}\n{"x":"hello"}');
    expect(result.fieldSummary['x']).toContain('number');
    expect(result.fieldSummary['x']).toContain('string');
  });
});

describe('serializeJsonl', () => {
  it('serializes records to JSONL', () => {
    const out = serializeJsonl([{ a: 1 }, { b: 2 }]);
    expect(out).toBe('{"a":1}\n{"b":2}');
  });
});

describe('updateJsonlRecord', () => {
  it('updates a record by index', () => {
    const updated = updateJsonlRecord('{"a":1}', 0, (record) => ({ ...(record as object), a: 2 }));
    expect(updated).toBe('{"a":2}');
  });

  it('ignores out of range index', () => {
    const updated = updateJsonlRecord('{"a":1}', 5, (record) => ({ ...(record as object), a: 2 }));
    expect(updated).toBe('{"a":1}');
  });
});
