'use client';

import { CostBreakdown } from '@/components/tools/ai/shared/cost-breakdown';
import { MetricCard } from '@/components/tools/ai/shared/metric-card';
import { ModelSelector } from '@/components/tools/ai/shared/model-selector';
import { RelatedTools } from '@/components/tools/ai/shared/related-tools';
import { ResultCard } from '@/components/tools/ai/shared/result-card';
import { ToolPageShell } from '@/components/tools/ai/shared/tool-page-shell';
import { Badge } from '@/components/ui/badge';
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

  const badgeClasses: Record<string, string> = {
    recommended: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    neutral: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'not-worth-it': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    unavailable: 'bg-muted text-muted-foreground',
  };

  const breakdownItems = [
    { label: 'Cached cost', value: result.cachedCost, color: '#10b981' },
    { label: 'Uncached cost', value: result.uncachedCost, color: '#3b82f6' },
  ];

  const savingsPercent = result.uncachedCost > 0 ? (result.savings / result.uncachedCost) * 100 : 0;

  return (
    <ToolPageShell
      title="Prompt Cache Calculator"
      description="Calculate whether prompt caching saves money based on token mix and hit rate."
      backHref="/ai"
    >
      <div className="space-y-4">
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
      </div>

      <div className="space-y-4">
        <ResultCard value={result.savings} label="Estimated savings" />
        <CostBreakdown items={breakdownItems} label="Cost comparison" />
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            label="Break-even calls"
            value={result.breakEvenCalls.toLocaleString('en-US')}
          />
          <MetricCard label="Savings %" value={`${savingsPercent.toFixed(1)}%`} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Recommendation:</span>
          <Badge className={badgeClasses[result.recommendation] ?? badgeClasses['unavailable']}>
            {result.recommendation}
          </Badge>
        </div>
        <RelatedTools toolId="cache-calculator" />
      </div>
    </ToolPageShell>
  );
}
