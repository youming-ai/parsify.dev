'use client';

import { MetricCard } from '@/components/tools/ai/shared/metric-card';
import { RelatedTools } from '@/components/tools/ai/shared/related-tools';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  exportFilledJsonl,
  extractVariables,
  fillTemplate,
} from '@/lib/llm/prompt-variable-filler';
import { useMemo, useState } from 'react';

export function PromptVariableFiller() {
  const [template, setTemplate] = useState('Hi {{name}}, your order {{order_id}} is {{status}}.');
  const [values, setValues] = useState<Record<string, string>>({});
  const [batchText, setBatchText] = useState('');

  const vars = useMemo(() => extractVariables(template), [template]);
  const result = useMemo(() => fillTemplate(template, values), [template, values]);

  const batchJsonl = useMemo(() => {
    if (!batchText.trim()) return '';
    const varNames = vars.map((v) => v.name);
    const rows = batchText
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const parts = line.split(',').map((p) => p.trim());
        const row: Record<string, string> = {};
        for (let i = 0; i < varNames.length; i++) {
          const varName = varNames[i]!;
          row[varName] = parts[i] ?? '';
        }
        return row;
      });
    return exportFilledJsonl(template, rows);
  }, [template, batchText, vars]);

  const handleValueChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prompt Variable Filler</CardTitle>
          <CardDescription>
            Extract prompt variables, fill templates, and export batch prompts as JSONL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={template}
            onChange={(event) => setTemplate(event.target.value)}
            placeholder="Template with {{variables}}"
            rows={6}
          />
        </CardContent>
      </Card>

      {vars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Variables</CardTitle>
            <CardDescription>Fill values for each extracted variable.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {vars.map((v) => (
              <div key={v.name} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label>{v.name}</Label>
                  <Badge variant="outline" className="text-xs">
                    {v.syntax}
                  </Badge>
                </div>
                <Input
                  value={values[v.name] ?? ''}
                  onChange={(event) => handleValueChange(v.name, event.target.value)}
                  placeholder={`Value for ${v.name}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <MetricCard label="Variable count" value={vars.length} />
        <MetricCard label="Estimated tokens" value={result.estimatedTokens} />
        <MetricCard
          label="Missing variables"
          value={result.missingVariables.length > 0 ? result.missingVariables.join(', ') : 'None'}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filled prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={result.filled} readOnly rows={6} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Batch rows (JSONL)</CardTitle>
          <CardDescription>
            Paste CSV-like rows (one per line, columns: {vars.map((v) => v.name).join(', ')}{' '}
            {vars.length === 0 && '(extract variables from template first)'})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={batchText}
            onChange={(event) => setBatchText(event.target.value)}
            placeholder={vars.length > 0 ? vars.map((v) => v.name).join(',') : 'variables...'}
            rows={4}
          />
          {batchJsonl && (
            <>
              <Label>JSONL output</Label>
              <Card className="overflow-auto bg-muted p-4">
                <pre className="text-sm">{batchJsonl}</pre>
              </Card>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigator.clipboard.writeText(batchJsonl)}
              >
                Copy JSONL
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <RelatedTools toolId="prompt-variable-filler" />
    </div>
  );
}
