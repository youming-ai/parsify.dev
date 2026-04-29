'use client';

import { CodeExportTabs } from '@/components/tools/ai/shared/code-export-tabs';
import { MetricCard } from '@/components/tools/ai/shared/metric-card';
import { RelatedTools } from '@/components/tools/ai/shared/related-tools';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { generateSchemaFromJson } from '@/lib/llm/schema-generator';
import { useMemo, useState } from 'react';

export function SchemaGenerator() {
  const [input, setInput] = useState('');

  const result = useMemo(() => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(input);
    } catch {
      return { schema: null, warnings: [] as { path: string; message: string }[] };
    }
    return generateSchemaFromJson(parsed);
  }, [input]);

  const schemaJson = result.schema ? JSON.stringify(result.schema, null, 2) : '';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>LLM JSON Schema Generator</CardTitle>
          <CardDescription>
            Generate LLM-friendly JSON Schema from JSON examples with compatibility notes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder='Paste a JSON example, e.g. {"name":"Alice","age":30}'
            rows={12}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <MetricCard label="Warnings" value={result.warnings.length} />
        <MetricCard label="Valid JSON" value={result.schema ? 'Yes' : 'No'} />
      </div>

      {result.schema !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Schema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.warnings.length > 0 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <p className="text-sm font-medium text-yellow-800">Compatibility notes</p>
                <ul className="mt-1 list-inside list-disc text-sm text-yellow-800">
                  {result.warnings.map((w) => (
                    <li key={`${w.path}_${w.message}`}>{w.message}</li>
                  ))}
                </ul>
              </div>
            )}
            <CodeExportTabs examples={{ Schema: schemaJson }} />
          </CardContent>
        </Card>
      )}

      <RelatedTools toolId="schema-generator" />
    </div>
  );
}
