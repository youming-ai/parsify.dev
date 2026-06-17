import type { OcrProgress } from '~/lib/ocr/types';
import { cn } from '~/lib/utils';

interface OcrProgressProps {
  progress: OcrProgress | null;
  className?: string;
}

const STAGE_LABELS: Record<OcrProgress['stage'], string> = {
  idle: 'Ready',
  'loading-models': 'Loading models',
  detecting: 'Detecting text',
  classifying: 'Classifying direction',
  recognizing: 'Recognizing text',
};

export function OcrProgressIndicator({ progress, className }: OcrProgressProps) {
  if (!progress || progress.stage === 'idle') return null;

  return (
    <div className={cn('w-full space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{progress.message}</span>
        <span className="text-muted-foreground">{Math.round(progress.progress * 100)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${Math.round(progress.progress * 100)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground/60">{STAGE_LABELS[progress.stage]}</p>
    </div>
  );
}
