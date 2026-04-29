'use client';

import { MetricCard } from '@/components/tools/ai/shared/metric-card';
import { RelatedTools } from '@/components/tools/ai/shared/related-tools';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { validateFinetuningDataset } from '@/lib/llm/finetuning-validator';
import { useMemo, useState } from 'react';

export function FinetuningValidator() {
  const [input, setInput] = useState('');

  const result = useMemo(() => validateFinetuningDataset(input), [input]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fine-tuning Dataset Validator</CardTitle>
          <CardDescription>
            Validate OpenAI-style JSONL fine-tuning datasets for format, roles, duplicates, and
            token size.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder='{"messages":[{"role":"system","content":"Rules"},{"role":"user","content":"Hi"},{"role":"assistant","content":"Hello"}]}'
            rows={12}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
        <MetricCard label="Total lines" value={result.totalLines} />
        <MetricCard label="Valid" value={result.validRecords} />
        <MetricCard label="Invalid" value={result.invalidRecords} />
        <MetricCard label="Duplicates" value={result.duplicateCount} />
        <MetricCard label="Min tokens" value={result.tokenStats.min} />
        <MetricCard label="Max tokens" value={result.tokenStats.max} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard label="Average tokens" value={result.tokenStats.average.toFixed(1)} />
        <MetricCard
          label="Valid rate"
          value={
            result.totalLines > 0
              ? `${Math.round((result.validRecords / result.totalLines) * 100)}%`
              : 'N/A'
          }
        />
        <MetricCard label="Deduped count" value={result.validRecords - result.duplicateCount} />
      </div>

      {result.roleWarnings.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Role warnings <Badge variant="outline">{result.roleWarnings.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <ul className="space-y-1">
                {result.roleWarnings.map((w, i) => (
                  <li key={`warn-${i}`} className="text-sm text-muted-foreground">
                    {w}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cleaned dataset (deduplicated)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={result.cleanedJsonl} readOnly rows={10} />
        </CardContent>
      </Card>

      <RelatedTools toolId="finetuning-validator" />
    </div>
  );
}
