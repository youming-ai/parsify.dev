import { parseSSEStream } from '@/lib/llm/sse-parser';
import { describe, expect, it } from 'vitest';

describe('parseSSEStream', () => {
  it('parses data events and skips done marker', () => {
    const result = parseSSEStream('event: message\ndata: {"delta":"hi"}\n\ndata: [DONE]\n\n');

    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.event).toBe('message');
    expect(result.events[0]?.json).toEqual({ delta: 'hi' });
  });
});
