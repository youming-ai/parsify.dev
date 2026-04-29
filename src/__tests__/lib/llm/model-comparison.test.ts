import { filterModelsForComparison, sortModelsForComparison } from '@/lib/llm/model-comparison';
import type { LLMModel } from '@/types/llm';
import { describe, expect, it } from 'vitest';

const mockModels: LLMModel[] = [
  {
    id: 'gpt-4o',
    provider: 'openai',
    displayName: 'GPT-4o',
    contextWindow: 128000,
    maxOutput: 16384,
    pricing: { input: 2.5, output: 10.0 },
    capabilities: ['text', 'vision', 'tool_use'],
    tokenizer: 'o200k',
    knowledgeCutoff: '2023-10',
  },
  {
    id: 'claude-3-5-sonnet',
    provider: 'anthropic',
    displayName: 'Claude 3.5 Sonnet',
    contextWindow: 200000,
    maxOutput: 8192,
    pricing: { input: 3.0, output: 15.0 },
    capabilities: ['text', 'vision', 'tool_use', 'prompt_cache'],
    tokenizer: 'claude',
    knowledgeCutoff: '2024-04',
  },
  {
    id: 'gemini-1-5-pro',
    provider: 'google',
    displayName: 'Gemini 1.5 Pro',
    contextWindow: 1000000,
    maxOutput: 8192,
    pricing: { input: 1.25, output: 5.0 },
    capabilities: ['text', 'vision', 'tool_use'],
    tokenizer: 'llama',
    knowledgeCutoff: '2024-05',
  },
];

describe('filterModelsForComparison', () => {
  it('filters by provider', () => {
    const result = filterModelsForComparison(mockModels, { provider: 'openai' });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('gpt-4o');
  });

  it('filters by capability', () => {
    const result = filterModelsForComparison(mockModels, { capability: 'prompt_cache' });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('claude-3-5-sonnet');
  });

  it('filters by minContextWindow', () => {
    const result = filterModelsForComparison(mockModels, { minContextWindow: 200000 });
    expect(result).toHaveLength(2);
  });

  it('filters by maxInputPrice', () => {
    const result = filterModelsForComparison(mockModels, { maxInputPrice: 2.0 });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('gemini-1-5-pro');
  });

  it('returns all when no filters', () => {
    const result = filterModelsForComparison(mockModels, {});
    expect(result).toHaveLength(3);
  });
});

describe('sortModelsForComparison', () => {
  it('sorts by name', () => {
    const result = sortModelsForComparison(mockModels, 'name');
    expect(result[0]?.displayName).toBe('Claude 3.5 Sonnet');
  });

  it('sorts by contextWindow descending', () => {
    const result = sortModelsForComparison(mockModels, 'contextWindow');
    expect(result[0]?.id).toBe('gemini-1-5-pro');
  });

  it('sorts by inputPrice ascending', () => {
    const result = sortModelsForComparison(mockModels, 'inputPrice');
    expect(result[0]?.id).toBe('gemini-1-5-pro');
  });

  it('sorts by outputPrice ascending', () => {
    const result = sortModelsForComparison(mockModels, 'outputPrice');
    expect(result[0]?.id).toBe('gemini-1-5-pro');
  });
});
