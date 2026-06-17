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

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Parse SSE data lines
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data.trim()) {
              accumulated += data;
              setState({ status: 'streaming', text: accumulated, error: null });
            }
          }
        }
      }

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
