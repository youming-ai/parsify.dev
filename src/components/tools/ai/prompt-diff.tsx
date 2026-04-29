'use client';

import { MetricCard } from '@/components/tools/ai/shared/metric-card';
import { RelatedTools } from '@/components/tools/ai/shared/related-tools';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { comparePrompts } from '@/lib/llm/prompt-diff';
import { useMemo, useState } from 'react';

export function PromptDiff() {
  const [original, setOriginal] = useState('');
  const [revised, setRevised] = useState('');

  const result = useMemo(() => comparePrompts(original, revised), [original, revised]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prompt Diff</CardTitle>
          <CardDescription>
            Compare prompt versions with token delta, variable extraction, and structure summaries.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <strong className="text-sm font-medium">Original</strong>
            <Textarea
              value={original}
              onChange={(event) => setOriginal(event.target.value)}
              rows={12}
              placeholder="Paste original prompt..."
            />
          </div>
          <div className="space-y-2">
            <strong className="text-sm font-medium">Revised</strong>
            <Textarea
              value={revised}
              onChange={(event) => setRevised(event.target.value)}
              rows={12}
              placeholder="Paste revised prompt..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Added Words" value={result.added} />
        <MetricCard label="Removed Words" value={result.removed} />
        <MetricCard label="Unchanged Words" value={result.unchanged} />
        <MetricCard
          label="Token Delta"
          value={`${result.tokenDelta > 0 ? '+' : ''}${result.tokenDelta}`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Variables</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Original</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {result.originalVariables.length === 0 ? (
                <span className="text-sm text-muted-foreground">None</span>
              ) : (
                result.originalVariables.map((v) => (
                  <Badge key={v} variant="secondary">{`{{${v}}}`}</Badge>
                ))
              )}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Revised</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {result.revisedVariables.length === 0 ? (
                <span className="text-sm text-muted-foreground">None</span>
              ) : (
                result.revisedVariables.map((v) => (
                  <Badge key={v} variant="secondary">{`{{${v}}}`}</Badge>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <RelatedTools toolId="prompt-diff" />
    </div>
  );
}
