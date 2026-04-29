'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type SupportedProvider = 'openai' | 'anthropic' | 'google';

interface ProviderSelectorProps {
  value: SupportedProvider;
  onValueChange: (value: SupportedProvider) => void;
}

export function ProviderSelector({ value, onValueChange }: ProviderSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Provider</Label>
      <Select value={value} onValueChange={(next) => onValueChange(next as SupportedProvider)}>
        <SelectTrigger>
          <SelectValue placeholder="Select provider" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="openai">OpenAI</SelectItem>
          <SelectItem value="anthropic">Anthropic</SelectItem>
          <SelectItem value="google">Google Gemini</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
