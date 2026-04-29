import { buildSimilarityMatrix, cosineSimilarity } from '@/lib/llm/embedding-visualizer';
import { describe, expect, it } from 'vitest';

describe('embedding visualizer', () => {
  it('computes cosine similarity', () => {
    const sim = cosineSimilarity([1, 0], [1, 0]);
    expect(sim).toBeCloseTo(1, 5);
  });

  it('builds symmetric similarity matrix', () => {
    const result = buildSimilarityMatrix([
      { label: 'a', vector: [1, 0] },
      { label: 'b', vector: [0, 1] },
    ]);
    expect(result.matrix[0]![1]).toBeCloseTo(0, 5);
    expect(result.matrix[0]![0]).toBeCloseTo(1, 5);
  });
});
