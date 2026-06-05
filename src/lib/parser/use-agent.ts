import { useState } from 'react';
import type { SeoAnalysisResponse } from '~/schemas/seo';

type RunArgs = {
  markdown: string;
  prompt: string;
  outputFormat?: 'text' | 'json';
};

export function useAgent() {
  const [text, setText] = useState('');
  const [seoData, setSeoData] = useState<SeoAnalysisResponse | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(args: RunArgs) {
    setText('');
    setSeoData(null);
    setError(null);
    setIsStreaming(true);

    const { outputFormat = 'json', ...rest } = args;

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...rest, outputFormat }),
      });

      if (!res.ok) {
        const body = await res.text();
        setError(body || `HTTP ${res.status}`);
        setIsStreaming(false);
        return;
      }

      if (outputFormat === 'json') {
        // For JSON format, parse the complete response
        const contentType = res.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const jsonData = await res.json();
          setSeoData(jsonData as SeoAnalysisResponse);
        } else {
          // If not JSON, treat as text
          const textContent = await res.text();
          setText(textContent);
        }
      } else {
        // For text format, stream the response
        if (!res.body) {
          setError('No response body');
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
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsStreaming(false);
    }
  }

  return { text, seoData, isStreaming, error, run } as const;
}
