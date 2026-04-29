'use client';

import { Textarea } from '@/components/ui/textarea';

interface JsonTextareaProps {
  value: string;
  onValueChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

export function JsonTextarea({ value, onValueChange, rows = 12, placeholder }: JsonTextareaProps) {
  let status = 'Valid JSON';
  if (value.trim().length === 0) {
    status = 'Empty input';
  } else {
    try {
      JSON.parse(value);
    } catch (error) {
      status = error instanceof Error ? error.message : 'Invalid JSON';
    }
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
      <p className="text-xs text-muted-foreground">{status}</p>
    </div>
  );
}
