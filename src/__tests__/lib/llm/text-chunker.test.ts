import { chunkText } from '@/lib/llm/text-chunker';
import { describe, expect, it } from 'vitest';

describe('chunkText', () => {
  it('splits text into overlapping chunks', () => {
    const chunks = chunkText('abcdefghijklmnopqrstuvwxyz', { chunkSize: 10, overlap: 2 });

    expect(chunks).toHaveLength(3);
    expect(chunks[0]?.text).toBe('abcdefghij');
    expect(chunks[1]?.text).toBe('ijklmnopqr');
    expect(chunks[1]?.startOffset).toBe(8);
  });
});
