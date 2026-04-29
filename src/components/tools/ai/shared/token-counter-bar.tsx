'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSelectedModel } from '@/hooks/use-selected-model';
import { estimateTokens } from '@/lib/llm/text-chunker';

interface TokenCounterBarProps {
  text: string;
  modelId: string;
}

export function TokenCounterBar({ text, modelId }: TokenCounterBarProps) {
  const model = useSelectedModel(modelId);
  const tokens = text.trim().length === 0 ? 0 : estimateTokens(text);
  const contextWindow = model?.contextWindow ?? 1;
  const usage = Math.min(100, (tokens / contextWindow) * 100);

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">Estimated tokens</span>
        <Badge variant="secondary">{tokens.toLocaleString()} tokens</Badge>
      </div>
      <Progress value={usage} />
      <p className="text-xs text-muted-foreground">
        {model ? `${model.displayName} context usage: ${usage.toFixed(2)}%` : 'Select a model'}
      </p>
    </div>
  );
}
