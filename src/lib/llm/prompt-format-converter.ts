import type { SupportedProvider } from '@/components/tools/ai/shared/provider-selector';

export interface PromptIR {
  version: string;
  system?: string;
  messages: Array<{ role: string; content: string }>;
  tools: unknown[];
}

export function normalizeToIR(input: string): PromptIR {
  try {
    const data = JSON.parse(input) as Record<string, unknown>;
    if (data['version'] && Array.isArray(data['messages'])) return data as unknown as PromptIR;
    if (Array.isArray(data)) {
      const systemMsg = data.find((msg: { role?: string }) => msg.role === 'system');
      return {
        version: '1.0',
        system: systemMsg?.content as string | undefined,
        messages: data
          .filter((msg: { role?: string; content?: unknown }) => msg.role !== 'system')
          .map((msg: { role?: string; content?: unknown }) => ({
            role: (msg.role as string) ?? 'user',
            content:
              typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content ?? ''),
          })),
        tools: [],
      };
    }
  } catch {
    /* fallthrough */
  }
  return {
    version: '1.0',
    messages: [{ role: 'user', content: input }],
    tools: [],
  };
}

export function serializeIRToProvider(
  ir: PromptIR,
  provider: SupportedProvider
): Record<string, unknown> {
  if (provider === 'openai') {
    const messages: Array<{ role: string; content: string }> = [];
    if (ir.system) messages.push({ role: 'system', content: ir.system });
    messages.push(...ir.messages);
    return { model: '', messages };
  }
  if (provider === 'anthropic') {
    const payload: Record<string, unknown> = {
      model: '',
      max_tokens: 1024,
      messages: ir.messages,
    };
    if (ir.system) payload['system'] = ir.system;
    return payload;
  }
  return {
    model: '',
    contents: ir.messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    })),
    ...(ir.system ? { systemInstruction: { parts: [{ text: ir.system }] } } : {}),
  };
}
