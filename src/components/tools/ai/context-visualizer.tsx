'use client';

import { MetricCard } from '@/components/tools/ai/shared/metric-card';
import { ModelSelector } from '@/components/tools/ai/shared/model-selector';
import { RelatedTools } from '@/components/tools/ai/shared/related-tools';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useSelectedModel } from '@/hooks/use-selected-model';
import { analyzeContextInput } from '@/lib/llm/context-visualizer';
import { useMemo, useState } from 'react';

export function ContextVisualizer() {
  const [input, setInput] = useState('');
  const [modelId, setModelId] = useState('gpt-4o');

  const model = useSelectedModel(modelId);
  const contextWindow = model?.contextWindow ?? 128000;
  const analysis = useMemo(() => analyzeContextInput(input, contextWindow), [input, contextWindow]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Context Window Visualizer</CardTitle>
          <CardDescription>
            Visualize how prompts, messages, and RAG context consume an LLM context window.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ModelSelector value={modelId} onValueChange={setModelId} />
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder='Paste a plain prompt or JSON array of messages like [{"role":"user","content":"hello"}]'
            rows={12}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Total Tokens" value={analysis.totalTokens} />
        <MetricCard label="Context Window" value={contextWindow.toLocaleString()} />
        <MetricCard label="Usage" value={`${analysis.contextUsagePercent.toFixed(1)}%`} />
        <MetricCard label="Remaining" value={analysis.remainingTokens} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Segments</CardTitle>
          <CardDescription>Breakdown by message role</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {analysis.segments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No input provided.</p>
          ) : (
            analysis.segments.map((segment) => (
              <div key={segment.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{segment.label}</span>
                  <Badge variant="secondary">{segment.estimatedTokens} tokens</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{segment.content}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {segment.percentShare.toFixed(1)}% · {segment.characters} chars
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {analysis.trimSuggestion && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium">Trim suggestion</p>
            <p className="mt-1 text-sm text-muted-foreground">{analysis.trimSuggestion}</p>
          </CardContent>
        </Card>
      )}

      <RelatedTools toolId="context-visualizer" />
    </div>
  );
}
