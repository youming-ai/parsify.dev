export interface EmbeddingItem {
  label: string;
  vector: number[];
}

export interface SimilarityMatrix {
  labels: string[];
  matrix: number[][];
}

export interface NearestNeighbor {
  item: string;
  nearest: string;
  similarity: number;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += (a[i] ?? 0) * (b[i] ?? 0);
    normA += (a[i] ?? 0) ** 2;
    normB += (b[i] ?? 0) ** 2;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function buildSimilarityMatrix(items: EmbeddingItem[]): SimilarityMatrix {
  const n = items.length;
  const matrix: number[][] = Array.from({ length: n }, () =>
    Array.from<number>({ length: n }).fill(0)
  );
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      matrix[i]![j] = cosineSimilarity(items[i]!.vector, items[j]!.vector);
    }
  }
  return { labels: items.map((item) => item.label), matrix };
}

export function findNearestNeighbors(items: EmbeddingItem[]): NearestNeighbor[] {
  return items.map((item, i) => {
    let best = Number.NEGATIVE_INFINITY;
    let bestIdx = -1;
    for (let j = 0; j < items.length; j++) {
      if (i === j) continue;
      const sim = cosineSimilarity(item.vector, items[j]!.vector);
      if (sim > best) {
        best = sim;
        bestIdx = j;
      }
    }
    return {
      item: item.label,
      nearest: items[bestIdx]!.label,
      similarity: best,
    };
  });
}
