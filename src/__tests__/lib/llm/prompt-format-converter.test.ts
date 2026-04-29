import { normalizeToIR, serializeIRToProvider } from '@/lib/llm/prompt-format-converter';
import { describe, expect, it } from 'vitest';

describe('prompt format converter', () => {
  it('normalizes OpenAI array to IR', () => {
    const ir = normalizeToIR(
      '[{"role":"system","content":"Rules"},{"role":"user","content":"Hi"}]'
    );
    expect(ir.system).toBe('Rules');
    expect(ir.messages).toHaveLength(1);
  });

  it('serializes IR to Anthropic', () => {
    const ir = normalizeToIR('[{"role":"user","content":"Hi"}]');
    const output = serializeIRToProvider(ir, 'anthropic');
    expect(output.system).toBeUndefined();
    expect(Array.isArray(output.messages)).toBe(true);
  });
});
