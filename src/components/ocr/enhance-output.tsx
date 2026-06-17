import { Sparkles } from 'lucide-react';
import { useI18n } from '~/components/i18n-provider';
import { CopyButton } from '~/components/ui/copy-button';
import { cn } from '~/lib/utils';

interface EnhanceOutputProps {
  text: string;
  isStreaming: boolean;
  error: string | null;
  className?: string;
}

/** AI-cleaned version of the recognized text, shown as a callout above the raw lines. */
export function EnhanceOutput({ text, isStreaming, error, className }: EnhanceOutputProps) {
  const { t } = useI18n();
  if (error) {
    return (
      <div
        className={cn(
          'rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive',
          className
        )}
      >
        <span className="font-mono text-[11px] tracking-wider">{t('output.aiError')}</span> {error}
      </div>
    );
  }

  if (!isStreaming && !text) return null;

  return (
    <div className={cn('rounded-md border border-detect/30 bg-detect/5 p-3', className)}>
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-display text-[11px] font-medium tracking-[0.14em] text-detect">
          <Sparkles className="h-3.5 w-3.5" />
          {t('output.ai')}
          {isStreaming && (
            <span className="ml-1 h-1.5 w-1.5 animate-pulse rounded-full bg-detect" />
          )}
        </span>
        {text && <CopyButton text={text} />}
      </div>
      {text ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{text}</p>
      ) : (
        <p className="text-sm text-muted-foreground">{t('output.aiWaiting')}</p>
      )}
    </div>
  );
}
