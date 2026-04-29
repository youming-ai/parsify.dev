import { estimateTokens } from '@/lib/llm/text-chunker';

export interface ContextSegment {
  id: string;
  role: string;
  label: string;
  content: string;
  characters: number;
  estimatedTokens: number;
  percentShare: number;
}

export interface ContextAnalysis {
  segments: ContextSegment[];
  totalTokens: number;
  contextUsagePercent: number;
  remainingTokens: number;
  trimSuggestion: string;
}

interface ParsedMessage {
  role: string;
  content: string;
}

function parseMessages(input: string): ParsedMessage[] {
  try {
    const parsed = JSON.parse(input) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .map((msg: { role?: unknown; content?: unknown }) => ({
          role: typeof msg.role === 'string' ? msg.role : 'user',
          content:
            typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content ?? ''),
        }))
        .filter((_msg) => true);
    }
  } catch {
    // not JSON array — fall through
  }
  return [{ role: 'user', content: input }];
}

export function analyzeContextInput(input: string, contextWindow: number): ContextAnalysis {
  const messages = parseMessages(input.trim());
  const rawSegments = messages.map((message, index) => ({
    id: `segment_${index + 1}`,
    role: message.role,
    label: `${message.role} ${index + 1}`,
    content: message.content,
    characters: message.content.length,
    estimatedTokens: estimateTokens(message.content),
  }));
  const totalTokens = rawSegments.reduce((sum, segment) => sum + segment.estimatedTokens, 0);
  const segments = rawSegments.map((segment) => ({
    ...segment,
    percentShare: totalTokens === 0 ? 0 : (segment.estimatedTokens / totalTokens) * 100,
  }));
  const safeWindow = Math.max(1, contextWindow);
  const contextUsagePercent = Math.min(100, (totalTokens / safeWindow) * 100);
  const remainingTokens = Math.max(0, safeWindow - totalTokens);
  const firstTrimCandidate = segments.find((segment) => segment.role !== 'system');

  return {
    segments,
    totalTokens,
    contextUsagePercent,
    remainingTokens,
    trimSuggestion: firstTrimCandidate
      ? `Trim ${firstTrimCandidate.label} to recover about ${firstTrimCandidate.estimatedTokens} tokens.`
      : 'No non-system segment available for trimming.',
  };
}
