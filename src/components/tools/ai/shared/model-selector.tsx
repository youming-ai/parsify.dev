import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLiveModels } from '@/hooks/use-live-models';
import { useMemo } from 'react';

interface ModelSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
}

export function ModelSelector({ value, onValueChange, label = 'Model' }: ModelSelectorProps) {
  const { data, loading, error } = useLiveModels();

  const groupedModels = useMemo(() => {
    if (!data) return [];
    const groups = new Map<string, { id: string; name: string }[]>();
    for (const m of data.models) {
      const list = groups.get(m.provider) ?? [];
      list.push({ id: m.id, name: m.name });
      groups.set(m.provider, list);
    }
    return Array.from(groups.entries())
      .map(([provider, models]) => ({
        provider,
        models: models.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.provider.localeCompare(b.provider));
  }, [data]);

  const isDisabled = loading || groupedModels.length === 0;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange} disabled={isDisabled}>
        <SelectTrigger>
          <SelectValue
            placeholder={
              loading ? 'Loading models...' : error ? 'Failed to load' : 'Select a model'
            }
          />
        </SelectTrigger>
        <SelectContent>
          {groupedModels.map((group) => (
            <SelectGroup key={group.provider}>
              <SelectLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                {group.provider.charAt(0).toUpperCase() + group.provider.slice(1)}
              </SelectLabel>
              {group.models.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-xs text-destructive">{error} (using cached models if available)</p>
      )}
    </div>
  );
}
