export interface ApiRequestInput {
  provider: string;
  model: string;
  system?: string;
  user: string;
  temperature: number;
  maxTokens: number;
  tools?: string;
}

export function buildApiPayload(input: ApiRequestInput): Record<string, unknown> {
  if (input.provider === 'openai') {
    const messages: Array<{ role: string; content: string }> = [];
    if (input.system) messages.push({ role: 'system', content: input.system });
    messages.push({ role: 'user', content: input.user });
    return {
      model: input.model,
      messages,
      temperature: input.temperature,
      max_tokens: input.maxTokens,
    };
  }
  if (input.provider === 'anthropic') {
    return {
      model: input.model,
      max_tokens: input.maxTokens,
      temperature: input.temperature,
      ...(input.system ? { system: input.system } : {}),
      messages: [{ role: 'user', content: input.user }],
    };
  }
  return {
    model: input.model,
    contents: [{ role: 'user', parts: [{ text: input.user }] }],
    generationConfig: {
      temperature: input.temperature,
      maxOutputTokens: input.maxTokens,
    },
    ...(input.system ? { systemInstruction: { parts: [{ text: input.system }] } } : {}),
  };
}

export function buildCurlCommand(
  url: string,
  apiKey: string,
  body: Record<string, unknown>
): string {
  return `curl ${url} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '${JSON.stringify(body)}'`;
}

export function buildFetchSnippet(url: string, body: Record<string, unknown>): string {
  return `fetch('${url}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer YOUR_API_KEY' },
  body: JSON.stringify(${JSON.stringify(body, null, 2).replace(/\n/g, '\n  ')})
});`;
}
