import type React from 'react';
import { cn } from '~/lib/utils';

interface DetectionFrameProps {
  children: React.ReactNode;
  /** Mono tag pinned to the top-right corner, e.g. a confidence value. */
  label?: string;
  /** Mono tag pinned to the bottom-left corner, e.g. coordinates. */
  coord?: string;
  /** Render the active (magenta lock) state instead of idle detect-green. */
  active?: boolean;
  /** Show a scan beam: looping idle sweep, or a single pass on mount. */
  scan?: 'idle' | 'once';
  /** Solid background behind the corner tags so they sit cleanly over the line. */
  tagBg?: string;
  className?: string;
  contentClassName?: string;
}

/**
 * The signature primitive: corner registration brackets + optional mono tags
 * and a scan beam. Mirrors the OCR detection overlay so the same visual
 * language wraps the hero word, the upload bed, and active results.
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
  const lineColor = active ? 'border-lock' : 'border-detect';
  const tagColor = active ? 'text-lock' : 'text-detect';
  const corner = cn('pointer-events-none absolute h-3 w-3', lineColor);

  return (
    <div className={cn('relative', className)}>
      <span className={cn(corner, 'left-0 top-0 border-l-2 border-t-2')} />
      <span className={cn(corner, 'right-0 top-0 border-r-2 border-t-2')} />
      <span className={cn(corner, 'bottom-0 left-0 border-b-2 border-l-2')} />
      <span className={cn(corner, 'bottom-0 right-0 border-b-2 border-r-2')} />

      {scan && <span className={scan === 'idle' ? 'scan-beam' : 'scan-beam-once'} />}

      {label && (
        <span
          className={cn(
            'absolute -top-2 right-2 px-1 font-display text-[10px] font-medium leading-none tracking-wider',
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
