'use client';

import { CodeExportTabs } from '@/components/tools/ai/shared/code-export-tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { type NeutralToolSchema, convertToolSchema } from '@/lib/llm/tool-schema-converter';
import { useMemo, useState } from 'react';

const sample = JSON.stringify(
  {
    name: 'search_web',
    description: 'Search the web.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Search query' } },
      required: ['query'],
    },
  },
  null,
  2
);

export function ToolSchemaConverter() {
  const [input, setInput] = useState(sample);
  const { output, error } = useMemo(() => {
    try {
      const converted = convertToolSchema(JSON.parse(input) as NeutralToolSchema);
      return {
        output: Object.fromEntries(
          Object.entries(converted).map(([key, value]) => [key, JSON.stringify(value, null, 2)])
        ),
        error: null,
      };
    } catch (e) {
      return { output: null, error: e instanceof Error ? e.message : 'Invalid JSON' };
    }
  }, [input]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tool Schema Converter</CardTitle>
        <CardDescription>
          Convert one neutral tool definition into provider-specific formats.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <Textarea value={input} onChange={(event) => setInput(event.target.value)} rows={18} />
        {error ? (
          <div className="rounded-lg border border-destructive/40 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : (
          output && <CodeExportTabs examples={output} />
        )}
      </CardContent>
    </Card>
  );
}
