import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ToolLoadingProps {
  message?: string;
  onRetry?: () => void;
}

export function ToolLoading({ message = "Loading...", onRetry }: ToolLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <LoadingSkeleton className="h-4 w-32" />
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{message}</p>
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
