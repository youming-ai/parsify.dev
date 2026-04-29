'use client';

import { MetricCard } from '@/components/tools/ai/shared/metric-card';
import { RelatedTools } from '@/components/tools/ai/shared/related-tools';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLiveModels } from '@/hooks/use-live-models';
import type { LiveModel } from '@/lib/llm/live-registry';
import { filterModelsForComparison, sortModelsForComparison } from '@/lib/llm/model-comparison';
import type { ComparisonSortKey } from '@/lib/llm/model-comparison';
import { useMemo, useState } from 'react';

function adaptLiveModel(model: LiveModel) {
  return {
    id: model.id,
    provider: model.provider,
    displayName: model.name,
    contextWindow: model.contextWindow,
    pricing: { input: model.inputPrice, output: model.outputPrice },
    capabilities: model.capabilities,
  };
}

export function ModelComparison() {
  const { data, loading } = useLiveModels();
  const [provider, setProvider] = useState('');
  const [capability, setCapability] = useState('');
  const [minContext, setMinContext] = useState('');
  const [maxInputPrice, setMaxInputPrice] = useState('');
  const [sortKey, setSortKey] = useState<ComparisonSortKey>('name');

  const liveModels = useMemo(() => data?.models.map(adaptLiveModel) ?? [], [data]);

  const filters = useMemo(
    () => ({
      provider: provider || undefined,
      capability: capability || undefined,
      minContextWindow: minContext ? Number(minContext) : undefined,
      maxInputPrice: maxInputPrice ? Number(maxInputPrice) : undefined,
    }),
    [provider, capability, minContext, maxInputPrice]
  );

  const filtered = useMemo(
    () => filterModelsForComparison(liveModels, filters),
    [liveModels, filters]
  );
  const sorted = useMemo(() => sortModelsForComparison(filtered, sortKey), [filtered, sortKey]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Model Comparison Table</CardTitle>
          <CardDescription>
            Filter and compare LLM models by context window, pricing, capabilities, and provider.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Provider</label>
            <Input
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="e.g. openai"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Capability</label>
            <Input
              value={capability}
              onChange={(e) => setCapability(e.target.value)}
              placeholder="e.g. vision"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Min context window</label>
            <Input
              type="number"
              value={minContext}
              onChange={(e) => setMinContext(e.target.value)}
              placeholder="e.g. 128000"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Max input $/M</label>
            <Input
              type="number"
              value={maxInputPrice}
              onChange={(e) => setMaxInputPrice(e.target.value)}
              placeholder="e.g. 5.0"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {(['name', 'contextWindow', 'inputPrice', 'outputPrice'] as ComparisonSortKey[]).map(
          (key) => (
            <Button
              key={key}
              size="sm"
              variant={sortKey === key ? 'default' : 'outline'}
              onClick={() => setSortKey(key)}
            >
              {key}
            </Button>
          )
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Total" value={liveModels.length} />
        <MetricCard label="Filtered" value={sorted.length} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Models</CardTitle>
          <CardDescription>{sorted.length} model(s)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sorted.map((model) => (
            <div key={model.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-5">
              <div className="col-span-2">
                <p className="text-sm font-medium">{model.displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {model.provider} · {model.capabilities.slice(0, 3).join(', ')}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {model.capabilities.map((cap) => (
                    <Badge key={cap} variant="secondary" className="text-[10px]">
                      {cap}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Context</p>
                <p className="text-sm font-semibold">{model.contextWindow.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Input $/M</p>
                <p className="text-sm font-semibold">{model.pricing.input}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Output $/M</p>
                <p className="text-sm font-semibold">{model.pricing.output}</p>
              </div>
            </div>
          ))}
          {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
        </CardContent>
      </Card>

      <RelatedTools toolId="model-comparison" />
    </div>
  );
}
