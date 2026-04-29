import { convertToolSchema } from '@/lib/llm/tool-schema-converter';
import { describe, expect, it } from 'vitest';

describe('convertToolSchema', () => {
  it('converts a neutral schema into provider formats', () => {
    const result = convertToolSchema({
      name: 'search_web',
      description: 'Search the web.',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Search query' } },
        required: ['query'],
      },
    });

    expect(result.openai.function.name).toBe('search_web');
    expect(result.anthropic.input_schema.required).toEqual(['query']);
    expect(result.gemini.functionDeclarations[0]?.parameters.required).toEqual(['query']);
    expect(result.mcp.inputSchema.required).toEqual(['query']);
  });
});
