'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface ResultCardProps {
  value: number;
  label: string;
  format?: 'currency' | 'number' | 'percentage';
  className?: string;
}

function formatValue(value: number, format: 'currency' | 'number' | 'percentage'): string {
  switch (format) {
    case 'currency':
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'number':
      return value.toLocaleString('en-US');
    case 'percentage':
      return `${value.toFixed(1)}%`;
  }
}

export function ResultCard({ value, label, format = 'currency', className }: ResultCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: displayValue intentionally omitted — animation should only trigger on value prop change
  useEffect(() => {
    const start = displayValue;
    const diff = value - start;
    if (diff === 0) return;

    const duration = 300;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayValue(start + diff * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <div className={cn('rounded-xl border bg-card p-6 transition-all duration-200', className)}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight transition-colors">
        {formatValue(format === 'number' ? value : displayValue, format)}
      </p>
    </div>
  );
}
