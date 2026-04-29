import { estimateTokens } from '@/lib/llm/text-chunker';

export interface FinetuningValidationResult {
  totalLines: number;
  validRecords: number;
  invalidRecords: number;
  roleWarnings: string[];
  duplicateCount: number;
  tokenStats: { min: number; max: number; average: number };
  cleanedJsonl: string;
}

export function validateFinetuningDataset(input: string): FinetuningValidationResult {
  const lines = input.split('\n').filter((line) => line.trim().length > 0);
  const validRecords: Array<Record<string, unknown>> = [];
  const roleWarnings: string[] = [];
  let invalidCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() ?? '';
    try {
      const record = JSON.parse(line) as Record<string, unknown>;
      const messages = record['messages'] as Array<{ role?: string; content?: string }> | undefined;
      if (!Array.isArray(messages) || messages.length === 0) {
        invalidCount++;
        continue;
      }
      if (messages[0]?.role !== 'system' && messages[0]?.role !== 'user') {
        roleWarnings.push(`Line ${i + 1}: first message role should be system or user`);
      }
      const lastRole = messages.at(-1)?.role;
      if (lastRole !== 'assistant') {
        roleWarnings.push(`Line ${i + 1}: last message role should be assistant`);
      }
      validRecords.push(record);
    } catch {
      invalidCount++;
    }
  }

  const seenHashes = new Set<string>();
  let duplicateCount = 0;
  const deduped: Array<Record<string, unknown>> = [];
  for (const record of validRecords) {
    const hash = JSON.stringify(record);
    if (seenHashes.has(hash)) {
      duplicateCount++;
    } else {
      seenHashes.add(hash);
      deduped.push(record);
    }
  }

  const tokenCounts = deduped.map((record) => estimateTokens(JSON.stringify(record)));
  const tokenStats = {
    min: tokenCounts.length === 0 ? 0 : Math.min(...tokenCounts),
    max: tokenCounts.length === 0 ? 0 : Math.max(...tokenCounts),
    average:
      tokenCounts.length === 0 ? 0 : tokenCounts.reduce((a, b) => a + b, 0) / tokenCounts.length,
  };

  return {
    totalLines: lines.length,
    validRecords: validRecords.length,
    invalidRecords: invalidCount,
    roleWarnings,
    duplicateCount,
    tokenStats,
    cleanedJsonl: deduped.map((r) => JSON.stringify(r)).join('\n'),
  };
}
