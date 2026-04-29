'use client';

import {
  type LiveRegistryResult,
  fetchLiveRegistry,
  loadCachedRegistry,
  saveCachedRegistry,
} from '@/lib/llm/live-registry';
import { useCallback, useEffect, useState } from 'react';

interface UseLiveModelsResult {
  data: LiveRegistryResult | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useLiveModels(): UseLiveModelsResult {
  const [data, setData] = useState<LiveRegistryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback((): void => {
    setLoading(true);
    setError(null);

    const cached = loadCachedRegistry();
    if (cached) {
      setData(cached);
      setLoading(false);
    }

    fetchLiveRegistry()
      .then((result) => {
        setData(result);
        saveCachedRegistry(result);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch models');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
