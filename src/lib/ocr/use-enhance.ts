import { useCallback, useState } from 'react';
import type { EnhanceRequest } from '~/schemas/enhance';

interface EnhanceState {
  status: 'idle' | 'streaming' | 'done' | 'error';
  text: string;
  error: string | null;
}

export function useEnhance() {
  const [state, setState] = useState<EnhanceState>({
    status: 'idle',
    text: '',
    error: null,
  });

  const run = useCallback(async (request: EnhanceRequest) => {
    setState({ status: 'streaming', text: '', error: null });

    try {
      const response = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
        throw new Error(
          (typeof body?.['message'] === 'string' ? body['message'] : null) ??
            `Request failed: ${response.status}`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      const processEvent = (event: string) => {
        let eventName = 'message';
        const dataLines: string[] = [];

        for (const line of event.split(/\r?\n/)) {
          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith('data: ')) {
            dataLines.push(line.slice(6));
          } else if (line.startsWith('data:')) {
            dataLines.push(line.slice(5));
          }
        }

        const data = dataLines.join('\n');
        if (eventName === 'error') {
          const parsed = JSON.parse(data) as { message?: string };
          throw new Error(parsed.message ?? 'LLM request failed');
        }

        if (eventName === 'done' || !data) return;

        accumulated += data;
        setState({ status: 'streaming', text: accumulated, error: null });
      };

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() ?? '';

        for (const event of events) processEvent(event);
      }

      buffer += decoder.decode();
      if (buffer.trim()) processEvent(buffer);

      setState({ status: 'done', text: accumulated, error: null });
    } catch (err) {
      setState({
        status: 'error',
        text: '',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle', text: '', error: null });
  }, []);

  return { ...state, run, reset };
}
