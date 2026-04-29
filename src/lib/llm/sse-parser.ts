export interface ParsedSSEEvent {
  id?: string;
  event?: string;
  data: string;
  json?: unknown;
  index: number;
}

export interface ParsedSSEStream {
  events: ParsedSSEEvent[];
  errors: string[];
}

export function parseSSEStream(input: string): ParsedSSEStream {
  const blocks = input
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  const errors: string[] = [];
  const events = blocks.flatMap((block, index): ParsedSSEEvent[] => {
    const lines = block.split('\n');
    let id: string | undefined;
    let event: string | undefined;
    const dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('id:')) id = line.slice(3).trim();
      if (line.startsWith('event:')) event = line.slice(6).trim();
      if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
    }

    const data = dataLines.join('\n');
    if (!data || data === '[DONE]') return [];

    try {
      return [{ id, event, data, json: JSON.parse(data), index }];
    } catch {
      errors.push(`Event ${index + 1} contains non-JSON data.`);
      return [{ id, event, data, index }];
    }
  });

  return { events, errors };
}
