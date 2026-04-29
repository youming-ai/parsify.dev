import { buildApiPayload, buildCurlCommand } from '@/lib/llm/api-request-builder';
import { describe, expect, it } from 'vitest';

describe('api request builder', () => {
  it('makes OpenAI payload with system prompt', () => {
    const payload = buildApiPayload({
      provider: 'openai',
      model: 'gpt-4o',
      system: 'You are helpful.',
      user: 'Hi',
      temperature: 0.7,
      maxTokens: 1000,
    });
    const messages = payload.messages as Array<{ role: string }>;
    expect(messages[0]?.role).toBe('system');
  });

  it('generates curl command', () => {
    const cmd = buildCurlCommand('https://api.openai.com/v1/chat/completions', 'sk-test', {
      model: 'gpt-4o',
      messages: [],
    });
    expect(cmd).toContain('curl');
    expect(cmd).toContain('Bearer sk-test');
  });
});
