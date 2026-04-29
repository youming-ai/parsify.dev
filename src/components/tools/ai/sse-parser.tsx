'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { parseSSEStream } from '@/lib/llm/sse-parser';
import { useMemo, useState } from 'react';

const sample =
  'event: message\ndata: {"delta":"Hello"}\n\ndata: {"delta":" world"}\n\ndata: [DONE]\n\n';

export function SSEParser() {
  const [input, setInput] = useState(sample);
  const parsed = useMemo(() => parseSSEStream(input), [input]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>LLM SSE Stream Parser</CardTitle>
        <CardDescription>
          Inspect raw streaming logs without sending them to a server.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <Textarea value={input} onChange={(event) => setInput(event.target.value)} rows={18} />
        <div className="space-y-3">
          {parsed.errors.map((error, i) => (
            <div
              key={i}
              className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive"
            >
              {error}
            </div>
          ))}
          {parsed.events.map((event) => (
            <pre key={event.index} className="overflow-auto rounded-lg bg-muted p-3 text-xs">
              {JSON.stringify(event, null, 2)}
            </pre>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
