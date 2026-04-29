'use client';

import { ModelSelector } from '@/components/tools/ai/shared/model-selector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSelectedModel } from '@/hooks/use-selected-model';
import { calculateMonthlyCost } from '@/lib/llm/cost-calculator';
import { useState } from 'react';

export function CostCalculator() {
  const [modelId, setModelId] = useState('gpt-4o');
  const [monthlyRequests, setMonthlyRequests] = useState(100000);
  const [inputTokens, setInputTokens] = useState(1000);
  const [outputTokens, setOutputTokens] = useState(500);
  const [cacheHitRate, setCacheHitRate] = useState(0);
  const [useBatch, setUseBatch] = useState(false);
  const model = useSelectedModel(modelId);
  const result = model
    ? calculateMonthlyCost({
        monthlyRequests,
        inputTokensPerRequest: inputTokens,
        outputTokensPerRequest: outputTokens,
        inputPricePerMillion: model.pricing.input,
        outputPricePerMillion: model.pricing.output,
        cacheReadPricePerMillion: model.pricing.cacheRead,
        cacheHitRate: cacheHitRate / 100,
        useBatch,
        batchInputPricePerMillion: model.pricing.batchInput,
        batchOutputPricePerMillion: model.pricing.batchOutput,
      })
    : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>LLM Cost Calculator</CardTitle>
        <CardDescription>
          Compare estimated monthly API spend using local calculations.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <ModelSelector value={modelId} onValueChange={setModelId} />
        <div className="space-y-2">
          <Label>Monthly requests</Label>
          <Input
            type="number"
            value={monthlyRequests}
            onChange={(event) => setMonthlyRequests(Number(event.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Average input tokens</Label>
          <Input
            type="number"
            value={inputTokens}
            onChange={(event) => setInputTokens(Number(event.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Average output tokens</Label>
          <Input
            type="number"
            value={outputTokens}
            onChange={(event) => setOutputTokens(Number(event.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Cache hit rate (%)</Label>
          <Input
            type="number"
            value={cacheHitRate}
            onChange={(event) => setCacheHitRate(Number(event.target.value))}
          />
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={useBatch} onCheckedChange={setUseBatch} />
          <Label>Use batch pricing when available</Label>
        </div>
        <div className="rounded-lg border p-4 lg:col-span-2">
          <p className="text-sm text-muted-foreground">Estimated monthly cost</p>
          <p className="text-3xl font-semibold">${(result?.totalCost ?? 0).toFixed(2)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
