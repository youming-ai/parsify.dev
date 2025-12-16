import { Button } from '@/components/ui/button';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { RefreshCw } from 'lucide-react';

interface ToolLoadingProps {
  message?: string;
  onRetry?: () => void;
}

export function ToolLoading({ message = 'Loading...', onRetry }: ToolLoadingProps) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center space-y-4">
      <div className="flex items-center space-x-3">
        <div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
        <LoadingSkeleton className="h-4 w-32" />
      </div>
      <p className="text-muted-foreground text-sm dark:text-muted-foreground">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Retry</span>
        </Button>
      )}
    </div>
  );
}
