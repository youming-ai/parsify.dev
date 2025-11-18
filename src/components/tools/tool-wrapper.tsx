import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

interface ToolWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  loading?: boolean;
  error?: string;
}

export function ToolWrapper({ children, title, description, loading, error }: ToolWrapperProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="flex-1">
            <LoadingSkeleton className="h-6 w-32 mb-2" />
            <LoadingSkeleton className="h-4 w-64" />
          </div>
        </div>
        <LoadingSkeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">!</span>
          </div>
          <div>
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(title || description) && (
        <div className="space-y-2">
          {title && <h2 className="text-xl font-semibold">{title}</h2>}
          {description && <p className="text-gray-600 dark:text-gray-400">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
