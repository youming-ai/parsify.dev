'use client';

import { useLiveModels } from '@/hooks/use-live-models';
import type { LiveModel } from '@/lib/llm/live-registry';

export interface UnifiedModel {
  id: string;
  provider: string;
  displayName: string;
  contextWindow: number;
  maxOutput: number;
  pricing: {
    input: number;
    output: number;
    cacheWrite?: number;
    cacheRead?: number;
    batchInput?: number;
    batchOutput?: number;
  };
  modalities: string[];
  capabilities: string[];
}

function liveToUnified(live: LiveModel): UnifiedModel {
  return {
    id: live.id,
    provider: live.provider,
    displayName: live.name,
    contextWindow: live.contextWindow,
    maxOutput: live.maxOutput,
    pricing: {
      input: live.inputPrice,
      output: live.outputPrice,
      cacheWrite: live.cacheWritePrice,
      cacheRead: live.cacheReadPrice,
    },
    modalities: live.modalities,
    capabilities: live.capabilities,
  };
}

export function useSelectedModel(modelId: string): UnifiedModel | null {
  const { data } = useLiveModels();

  if (!data) return null;

  const live = data.models.find((m) => m.id === modelId);
  if (!live) return null;

  return liveToUnified(live);
}
