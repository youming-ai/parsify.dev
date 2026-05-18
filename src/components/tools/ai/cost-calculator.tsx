import { useState } from 'react';
import { CostBreakdown } from '~/components/tools/ai/shared/cost-breakdown';
import { ModelSelector } from '~/components/tools/ai/shared/model-selector';
import { ResultCard } from '~/components/tools/ai/shared/result-card';
import { ToolPageShell } from '~/components/tools/ai/shared/tool-page-shell';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Switch } from '~/components/ui/switch';
import { useSelectedModel } from '~/hooks/use-selected-model';
import { calculateMonthlyCost } from '~/lib/llm/cost-calculator';

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

  const breakdownItems = result
    ? [
        { label: 'Input tokens', value: result.inputCost, color: '#3b82f6' },
        { label: 'Output tokens', value: result.outputCost, color: '#10b981' },
      ]
    : [];

  return (
    <ToolPageShell
      title="LLM Cost Calculator"
      description="Compare estimated monthly API spend using local calculations."
      backHref="/ai"
    >
      <div className="space-y-4">
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
      </div>

      <div className="space-y-4">
        {model ? (
          <>
            <ResultCard value={result?.totalCost ?? 0} label="Estimated monthly cost" />
            <CostBreakdown items={breakdownItems} label="Cost breakdown" />
          </>
        ) : (
          <>
            <div className="rounded-xl border bg-card p-6 space-y-3">
              <div className="h-4 w-32 rounded bg-muted animate-pulse" />
              <div className="h-10 w-48 rounded bg-muted animate-pulse" />
            </div>
            <div className="space-y-3">
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              <div className="h-8 w-full rounded bg-muted animate-pulse" />
              <div className="h-8 w-full rounded bg-muted animate-pulse" />
            </div>
          </>
        )}
      </div>
    </ToolPageShell>
  );
}
