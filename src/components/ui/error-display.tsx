/**
 * Error Display Components
 * Consistent error presentation with helpful actions
 */

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowsClockwise, WarningCircle } from '@phosphor-icons/react';

interface ErrorDisplayProps {
  error: Error | string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  showDetails?: boolean;
  variant?: 'inline' | 'card' | 'toast';
  actionLabel?: string;
  action?: () => void;
}

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  className,
  showDetails = false,
  variant = 'inline',
  actionLabel,
  action,
}: ErrorDisplayProps) {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  const baseClasses = 'flex items-start gap-3 p-4 rounded-lg border';

  const variantClasses = {
    inline: 'bg-destructive/10 border-destructive/20 text-destructive',
    card: 'bg-card border-border',
    toast: 'bg-background border-border shadow-lg',
  };

  const content = (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      <div className="flex-shrink-0">
        <WarningCircle className="h-5 w-5 text-destructive" />
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <p className="font-medium text-sm leading-none">
          {errorMessage || 'An unexpected error occurred'}
        </p>

        {showDetails && errorStack && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Error details
            </summary>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-muted-foreground">
              {errorStack}
            </pre>
          </details>
        )}

        <div className="mt-3 flex items-center gap-2">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="h-8">
              <ArrowsClockwise className="mr-1 h-3 w-3" />
              Retry
            </Button>
          )}

          {action && actionLabel && (
            <Button variant="outline" size="sm" onClick={action} className="h-8">
              {actionLabel}
            </Button>
          )}

          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss} className="h-8">
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return content;
}

// Tool-specific error display
export function ToolError({
  toolName,
  error,
  onRetry,
  showHelp = true,
}: {
  toolName: string;
  error: Error | string;
  onRetry?: () => void;
  showHelp?: boolean;
}) {
  const getHelpfulMessage = (error: Error | string): string => {
    const message = error instanceof Error ? error.message : error;

    // Common error patterns and helpful messages
    if (message.includes('JSON')) {
      return 'Invalid JSON format. Please check your input syntax.';
    }
    if (message.includes('Network')) {
      return 'Network error. Please check your internet connection.';
    }
    if (message.includes('Timeout')) {
      return 'Operation timed out. Try with a smaller input or increase timeout.';
    }
    if (message.includes('Memory')) {
      return 'Insufficient memory. Try with a smaller input.';
    }
    if (message.includes('Syntax')) {
      return 'Syntax error in your code. Please check the highlighted lines.';
    }

    return message;
  };

  const getDocumentationLink = (toolName: string): string | null => {
    const docsMap: Record<string, string> = {
      'json-formatter': '/docs/tools/json-formatter',
      'json-validator': '/docs/tools/json-validator',
      'code-executor': '/docs/tools/code-executor',
      'code-formatter': '/docs/tools/code-formatter',
    };

    return docsMap[toolName] || '/docs';
  };

  const helpfulMessage = getHelpfulMessage(error);
  const docLink = getDocumentationLink(toolName);

  return (
    <ErrorDisplay
      error={helpfulMessage}
      onRetry={onRetry}
      variant="card"
      showDetails={process.env.NODE_ENV === 'development'}
      action={showHelp && docLink ? () => window.open(docLink, '_blank') : undefined}
      actionLabel={showHelp && docLink ? 'Get Help' : undefined}
    />
  );
}

// Inline error for form fields
export function FieldError({ error }: { error: string | undefined }) {
  if (!error) return null;

  return (
    <div className="mt-1 flex items-center gap-2 text-destructive text-xs">
      <WarningCircle className="h-3 w-3 flex-shrink-0" />
      <span>{error}</span>
    </div>
  );
}

// Network error display
export function NetworkError({ error, onRetry }: { error: Error | string; onRetry?: () => void }) {
  return (
    <ErrorDisplay
      error="Network connection failed. Please check your internet connection and try again."
      onRetry={onRetry}
      variant="card"
      action={() => window.location.reload()}
      actionLabel="Refresh Page"
    />
  );
}

// Empty state with helpful message
export function EmptyState({
  title,
  description,
  action,
  actionLabel,
  icon,
}: {
  title: string;
  description: string;
  action?: () => void;
  actionLabel?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="mb-2 font-medium text-lg">{title}</h3>
      <p className="mb-6 max-w-md text-muted-foreground text-sm">{description}</p>
      {action && actionLabel && (
        <Button onClick={action} variant="outline">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default ErrorDisplay;
