'use client';

import { MetricCard } from '@/components/tools/ai/shared/metric-card';
import { RelatedTools } from '@/components/tools/ai/shared/related-tools';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { validateStructuredOutput } from '@/lib/llm/structured-output-validator';
import { useMemo, useState } from 'react';

export function OutputValidator() {
  const [schemaText, setSchemaText] = useState('');
  const [outputText, setOutputText] = useState('');

  const result = useMemo(() => {
    let schema: unknown;
    try {
      schema = JSON.parse(schemaText);
    } catch {
      return { valid: false, errors: [{ path: '#schema', message: 'Invalid JSON schema' }] };
    }
    return validateStructuredOutput(outputText, schema);
  }, [schemaText, outputText]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Structured Output Validator</CardTitle>
          <CardDescription>
            Validate LLM JSON output against a schema and locate field-level errors.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <strong className="text-sm font-medium">Schema (JSON)</strong>
            <Textarea
              value={schemaText}
              onChange={(event) => setSchemaText(event.target.value)}
              rows={12}
              placeholder='{"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}'
            />
          </div>
          <div className="space-y-2">
            <strong className="text-sm font-medium">Output (JSON or fenced)</strong>
            <Textarea
              value={outputText}
              onChange={(event) => setOutputText(event.target.value)}
              rows={12}
              placeholder='```json\n{"name":"Alice"}\n```'
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <MetricCard label="Valid" value={result.valid ? 'Yes' : 'No'} />
        <MetricCard label="Errors" value={result.errors.length} />
      </div>

      {result.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.errors.map((error, index) => (
              <div key={index} className="flex items-start gap-2">
                <Badge variant="destructive">{error.path}</Badge>
                <span className="text-sm text-muted-foreground">{error.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <RelatedTools toolId="output-validator" />
    </div>
  );
}
