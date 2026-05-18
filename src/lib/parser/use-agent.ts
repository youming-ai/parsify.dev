import { useState } from 'react';

type RunArgs = {
  markdown: string;
};

export function useAgent() {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(args: RunArgs) {
    setText('');
    setError(null);
    setIsStreaming(true);
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(args),
      });
      if (!res.ok || !res.body) {
        const body = await res.text();
        setError(body || `HTTP ${res.status}`);
        setIsStreaming(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        setText((t) => t + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsStreaming(false);
    }
  }

  return { text, isStreaming, error, run } as const;
}
