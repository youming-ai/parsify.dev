'use client';

import { MetricCard } from '@/components/tools/ai/shared/metric-card';
import { RelatedTools } from '@/components/tools/ai/shared/related-tools';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { lintSystemPrompt } from '@/lib/llm/prompt-linter';
import { useMemo, useState } from 'react';

function severityColor(severity: string): string {
  switch (severity) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
}

export function PromptLinter() {
  const [input, setInput] = useState('');

  const result = useMemo(() => lintSystemPrompt(input), [input]);
  const findingCounts = useMemo(() => {
    return {
      low: result.findings.filter((f) => f.severity === 'low').length,
      medium: result.findings.filter((f) => f.severity === 'medium').length,
      high: result.findings.filter((f) => f.severity === 'high').length,
    };
  }, [result]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Prompt Linter</CardTitle>
          <CardDescription>
            Analyze system prompts for clarity, structure, safety, and maintainability.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste your system prompt here..."
            rows={12}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Score" value={result.score} />
        <MetricCard label="Low" value={findingCounts.low} />
        <MetricCard label="Medium" value={findingCounts.medium} />
        <MetricCard label="High" value={findingCounts.high} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Findings</CardTitle>
          <CardDescription>{result.findings.length} issue(s) found</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.findings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No findings — great prompt!</p>
          ) : (
            result.findings.map((finding, index) => (
              <div key={`${finding.rule}_${index}`} className="rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Badge className={severityColor(finding.severity)}>{finding.severity}</Badge>
                  <span className="text-sm font-medium">{finding.rule}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{finding.message}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <RelatedTools toolId="prompt-linter" />
    </div>
  );
}
