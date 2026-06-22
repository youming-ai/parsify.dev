import type React from 'react';
import { cn } from '~/lib/utils';

interface DetectionFrameProps {
  children: React.ReactNode;
  /** Mono tag pinned to the top-right corner, e.g. a confidence value. */
  label?: string;
  /** Mono tag pinned to the bottom-left corner, e.g. coordinates. */
  coord?: string;
  /** Render the active (blue accent) state instead of idle foreground. */
  active?: boolean;
  /** Show a single-pass scan beam on mount. 'idle' is a no-op (retained for source compat). */
  scan?: 'idle' | 'once';
  /** Solid background behind the corner tags so they sit cleanly over the line. */
  tagBg?: string;
  className?: string;
  contentClassName?: string;
}

/**
 * Corner registration brackets + optional mono tags and a scan beam.
 * Idle state uses foreground; active uses blue-700 (ring).
 */
export function DetectionFrame({
  children,
  label,
  coord,
  active = false,
  scan,
  tagBg = 'bg-background',
  className,
  contentClassName,
}: DetectionFrameProps) {
  const lineColor = active ? 'border-ring' : 'border-foreground';
  const tagColor = active ? 'text-ring' : 'text-foreground';
  const corner = cn('pointer-events-none absolute h-3 w-3', lineColor);

  return (
    <div className={cn('relative', className)}>
      <span className={cn(corner, 'left-0 top-0 border-l-2 border-t-2')} />
      <span className={cn(corner, 'right-0 top-0 border-r-2 border-t-2')} />
      <span className={cn(corner, 'bottom-0 left-0 border-b-2 border-l-2')} />
      <span className={cn(corner, 'bottom-0 right-0 border-b-2 border-r-2')} />

      {scan === 'once' && <span className="scan-beam-once" />}

      {label && (
        <span
          className={cn(
            'absolute -top-2 right-2 px-1 font-mono text-[10px] font-medium leading-none tracking-wider',
            tagBg,
            tagColor
          )}
        >
          {label}
        </span>
      )}
      {coord && (
        <span
          className={cn(
            'absolute -bottom-2 left-2 px-1 font-mono text-[10px] leading-none',
            tagBg,
            'text-muted-foreground'
          )}
        >
          {coord}
        </span>
      )}

      <div className={contentClassName}>{children}</div>
    </div>
  );
}
