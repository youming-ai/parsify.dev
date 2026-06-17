import { CopyButton } from '~/components/ui/copy-button';
import { cn } from '~/lib/utils';

interface EnhanceOutputProps {
  text: string;
  isStreaming: boolean;
  error: string | null;
  className?: string;
}

export function EnhanceOutput({ text, isStreaming, error, className }: EnhanceOutputProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          Enhanced Result
          {isStreaming && (
            <span className="ml-2 text-xs text-muted-foreground animate-pulse">streaming…</span>
          )}
        </h3>
        {text && <CopyButton text={text} />}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="min-h-[100px] max-h-[400px] overflow-y-auto rounded-md border bg-muted/50 p-3">
        {text ? (
          <pre className="whitespace-pre-wrap font-mono text-sm">{text}</pre>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isStreaming
              ? 'Waiting for response…'
              : 'Enhanced text will appear here after OCR processing.'}
          </p>
        )}
      </div>
    </div>
  );
}
