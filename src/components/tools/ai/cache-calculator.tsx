'use client';

import { MetricCard } from '@/components/tools/ai/shared/metric-card';
import { ModelSelector } from '@/components/tools/ai/shared/model-selector';
import { RelatedTools } from '@/components/tools/ai/shared/related-tools';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSelectedModel } from '@/hooks/use-selected-model';
import { calculatePromptCache } from '@/lib/llm/prompt-cache';
import { useMemo, useState } from 'react';

export function CacheCalculator() {
  const [modelId, setModelId] = useState('gpt-4o');
  const [staticTokens, setStaticTokens] = useState(5000);
  const [dynamicTokens, setDynamicTokens] = useState(500);
  const [outputTokens, setOutputTokens] = useState(300);
  const [monthlyCalls, setMonthlyCalls] = useState(10000);
  const [hitRate, setHitRate] = useState(80);

  const model = useSelectedModel(modelId);
  const result = useMemo(() => {
    const inputPrice = model?.pricing.input ?? 0;
    const outputPrice = model?.pricing.output ?? 0;
    const cacheWritePrice = model?.pricing.cacheWrite;
    const cacheReadPrice = model?.pricing.cacheRead;
    return calculatePromptCache({
      staticTokens,
      dynamicTokens,
      outputTokens,
      monthlyCalls,
      inputPrice,
      outputPrice,
      cacheWritePrice,
      cacheReadPrice,
      hitRate: hitRate / 100,
    });
  }, [staticTokens, dynamicTokens, outputTokens, monthlyCalls, hitRate, model]);

  const badgeColor =
    result.recommendation === 'recommended'
      ? 'bg-green-100 text-green-800'
      : result.recommendation === 'not-worth-it'
        ? 'bg-red-100 text-red-800'
        : 'bg-yellow-100 text-yellow-800';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prompt Cache Calculator</CardTitle>
          <CardDescription>
            Calculate whether prompt caching saves money based on token mix and hit rate.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <ModelSelector value={modelId} onValueChange={setModelId} />
          <div className="space-y-2">
            <Label>Static tokens (per request)</Label>
            <Input
              type="number"
              value={staticTokens}
              onChange={(event) => setStaticTokens(Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Dynamic tokens (per request)</Label>
            <Input
              type="number"
              value={dynamicTokens}
              onChange={(event) => setDynamicTokens(Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Output tokens (per request)</Label>
            <Input
              type="number"
              value={outputTokens}
              onChange={(event) => setOutputTokens(Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Monthly calls</Label>
            <Input
              type="number"
              value={monthlyCalls}
              onChange={(event) => setMonthlyCalls(Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Cache hit rate (%)</Label>
            <Input
              type="number"
              value={hitRate}
              onChange={(event) => setHitRate(Number(event.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Uncached Cost" value={`$${result.uncachedCost.toFixed(2)}`} />
        <MetricCard label="Cached Cost" value={`$${result.cachedCost.toFixed(2)}`} />
        <MetricCard label="Savings" value={`$${result.savings.toFixed(2)}`} />
        <MetricCard label="Break-even Calls" value={result.breakEvenCalls.toLocaleString()} />
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Recommendation:</span>
        <Badge className={badgeColor}>{result.recommendation}</Badge>
      </div>

      <RelatedTools toolId="cache-calculator" />
    </div>
  );
}
