export interface ChunkTextOptions {
  chunkSize: number;
  overlap: number;
}

export interface TextChunk {
  chunkId: string;
  text: string;
  startOffset: number;
  endOffset: number;
  estimatedTokens: number;
}

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function chunkText(text: string, options: ChunkTextOptions): TextChunk[] {
  const chunkSize = Math.max(1, options.chunkSize);
  const overlap = Math.min(Math.max(0, options.overlap), chunkSize - 1);
  const step = chunkSize - overlap;
  const chunks: TextChunk[] = [];

  for (let start = 0; start < text.length; start += step) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    chunks.push({
      chunkId: `chunk_${String(chunks.length + 1).padStart(4, '0')}`,
      text: chunk,
      startOffset: start,
      endOffset: end,
      estimatedTokens: estimateTokens(chunk),
    });

    if (end === text.length) break;
  }

  return chunks;
}
