import { useState } from 'react';
import type { ParseError, ParseResponse } from '~/schemas/parse';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function useParse() {
  const [status, setStatus] = useState<Status>('idle');
  const [data, setData] = useState<ParseResponse | null>(null);
  const [error, setError] = useState<ParseError | null>(null);

  async function run(url: string) {
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const body = (await res.json()) as ParseError;
        setError(body);
        setStatus('error');
        return;
      }
      setData((await res.json()) as ParseResponse);
      setStatus('success');
    } catch (err) {
      setError({ error: 'FETCH_FAILED', message: (err as Error).message });
      setStatus('error');
    }
  }

  return { status, data, error, run } as const;
}
