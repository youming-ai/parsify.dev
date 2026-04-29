'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLiveModels } from '@/hooks/use-live-models';
import { useCallback, useMemo } from 'react';

interface ModelSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
}

export function ModelSelector({ value, onValueChange, label = 'Model' }: ModelSelectorProps) {
  const { data, loading, error } = useLiveModels();

  const provider = useMemo(() => {
    const model = data?.models.find((m) => m.id === value);
    return model?.provider ?? '';
  }, [value, data]);

  const providerOptions = useMemo(() => data?.providers ?? [], [data]);

  const modelOptions = useMemo(() => {
    if (!data) return [];
    if (provider) return data.models.filter((m) => m.provider === provider);
    return data.models;
  }, [data, provider]);

  const handleProviderChange = useCallback(
    (nextProvider: string) => {
      if (!data) return;
      const match = data.models.find((m) => m.provider === nextProvider);
      if (match) onValueChange(match.id);
    },
    [data, onValueChange]
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label>Provider</Label>
          <Select
            value={provider}
            onValueChange={handleProviderChange}
            disabled={providerOptions.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              {providerOptions.map((p) => (
                <SelectItem key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{label}</Label>
          <Select value={value} onValueChange={onValueChange} disabled={modelOptions.length === 0}>
            <SelectTrigger>
              <SelectValue placeholder={provider ? 'Select model' : 'Choose provider first'} />
            </SelectTrigger>
            <SelectContent>
              {modelOptions.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error} (using cached models if available)</p>
      )}
      {loading && (
        <p className="text-xs text-muted-foreground">Loading models from OpenRouter...</p>
      )}
    </div>
  );
}
