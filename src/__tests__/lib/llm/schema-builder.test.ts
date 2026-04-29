import { buildJsonSchema } from '@/lib/llm/schema-builder';
import { describe, expect, it } from 'vitest';

describe('buildJsonSchema', () => {
  it('creates object schema with required params', () => {
    const result = buildJsonSchema({
      name: 'search',
      description: 'Search',
      parameters: [
        {
          id: '1',
          name: 'query',
          type: 'string',
          required: true,
          description: 'Search term',
        },
      ],
    });
    expect(result.required).toEqual(['query']);
    expect(result.additionalProperties).toBe(false);
  });
});
