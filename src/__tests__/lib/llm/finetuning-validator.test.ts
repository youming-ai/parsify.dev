import { validateFinetuningDataset } from '@/lib/llm/finetuning-validator';
import { describe, expect, it } from 'vitest';

describe('validateFinetuningDataset', () => {
  it('validates OpenAI-format records', () => {
    const result = validateFinetuningDataset(
      '{"messages":[{"role":"user","content":"Hi"},{"role":"assistant","content":"Hello"}]}\nnot json'
    );
    expect(result.totalLines).toBe(2);
    expect(result.validRecords).toBe(1);
    expect(result.invalidRecords).toBe(1);
  });
});
