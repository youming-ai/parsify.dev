'use client';

import { cn } from '@/lib/utils';

interface BreakdownItem {
  label: string;
  value: number;
  color: string;
}

interface CostBreakdownProps {
  items: BreakdownItem[];
  label: string;
  className?: string;
}

export function CostBreakdown({ items, label, className }: CostBreakdownProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={cn('space-y-3', className)}>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="min-w-[80px] text-sm">{item.label}</span>
            <div className="flex-1">
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${total > 0 ? (item.value / total) * 100 : 0}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
            <span className="w-24 text-right text-sm tabular-nums">
              $
              {item.value.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
