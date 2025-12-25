'use client';

/**
 * Standardized Tool Wrapper Component
 * Provides consistent layout, error handling, and loading states for all tools
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { ProcessingStatus, ToolComponentProps } from '@/types/components';
import {
  ArrowsClockwise,
  CheckCircle,
  CircleNotch,
  Copy,
  DownloadSimple,
  WarningCircle,
} from '@phosphor-icons/react';
import React, { Suspense } from 'react';

interface ToolWrapperProps extends ToolComponentProps {
  /** Tool title */
  title: string;
  /** Tool description */
  description?: string;
  /** Tool category */
  category?: string;
  /** Tool difficulty level */
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  /** Processing status */
  status?: ProcessingStatus;
  /** Result data */
  result?: any;
  /** Whether to show tool header */
  showHeader?: boolean;
  /** Whether to show progress indicator */
  showProgress?: boolean;
  /** Custom error message */
  errorMessage?: string;
  /** Custom success message */
  successMessage?: string;
  /** Additional action buttons */
  actionButtons?: React.ReactNode;
  /** Maximum width of the wrapper */
  maxWidth?: string;
}

/**
 * Standardized wrapper component for all tools
 */
export const ToolWrapper: React.FC<ToolWrapperProps> = ({
  id,
  className,
  children,
  title,
  description,
  category,
  difficulty,
  status,
  result,
  showHeader = true,
  showProgress = true,
  errorMessage,
  successMessage,
  actionButtons,
  maxWidth = '100%',
  onComplete,
  onError,
  onProgress,
  disabled = false,
  loading = false,
  ...props
}) => {
  // Compute loading state from status or loading prop
  const isLoading = loading || status?.status === 'processing';

  // Compute error state from status or errorMessage
  const hasError = status?.status === 'error' || !!errorMessage;

  // Compute success state from status
  const isSuccess = status?.status === 'completed';

  // Get difficulty badge color
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-muted text-gray-800 dark:bg-card dark:text-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    if (isLoading) {
      return <CircleNotch className="h-4 w-4 animate-spin" />;
    }
    if (hasError) {
      return <WarningCircle className="h-4 w-4 text-destructive" />;
    }
    if (isSuccess) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    return null;
  };

  // Render status alert
  const renderStatusAlert = () => {
    if (!status && !errorMessage && !successMessage) return null;

    const message = errorMessage || successMessage || status?.message;
    if (!message) return null;

    const variant = hasError ? 'destructive' : isSuccess ? 'default' : 'default';

    return (
      <Alert variant={variant} className="mb-4">
        {getStatusIcon()}
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    );
  };

  // Render progress indicator
  const renderProgress = () => {
    if (!showProgress || !isLoading || !status) return null;

    return (
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Processing...</span>
          <span className="font-mono">{status.progress}%</span>
        </div>
        <Progress value={status.progress} className="w-full" />
        {status.estimatedTimeRemaining && (
          <p className="text-muted-foreground text-xs">
            Estimated time remaining: {Math.round(status.estimatedTimeRemaining / 1000)}s
          </p>
        )}
      </div>
    );
  };

  // Render action buttons
  const renderActionButtons = () => {
    if (!actionButtons && !result) return null;

    const defaultButtons = result ? (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Copy to clipboard functionality
            if (typeof result === 'object') {
              navigator.clipboard.writeText(JSON.stringify(result, null, 2));
            } else {
              navigator.clipboard.writeText(String(result));
            }
          }}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // DownloadSimple functionality
            const blob = new Blob(
              [typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)],
              { type: 'application/json' }
            );
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-result.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
        >
          <DownloadSimple className="mr-2 h-4 w-4" />
          DownloadSimple
        </Button>
      </div>
    ) : null;

    return (
      <div className="mt-4 flex items-center justify-between">
        {defaultButtons}
        {actionButtons}
      </div>
    );
  };

  return (
    <div id={id} className={cn('w-full', className)} style={{ maxWidth }} {...props}>
      <Card className="w-full">
        {/* Header */}
        {showHeader && (
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="flex items-center gap-2">
                  {title}
                  {isLoading && (
                    <CircleNotch className="h-5 w-5 animate-spin text-muted-foreground" />
                  )}
                  {isSuccess && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {hasError && <WarningCircle className="h-5 w-5 text-destructive" />}
                </CardTitle>
                {description && <p className="text-muted-foreground text-sm">{description}</p>}
                <div className="flex items-center gap-2">
                  {category && <Badge variant="secondary">{category}</Badge>}
                  {difficulty && (
                    <Badge className={getDifficultyColor(difficulty)}>{difficulty}</Badge>
                  )}
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Reset functionality
                    window.location.reload();
                  }}
                  disabled={isLoading}
                >
                  <ArrowsClockwise className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        )}

        {/* Content */}
        <CardContent className="space-y-4">
          {/* Status alerts */}
          {renderStatusAlert()}

          {/* Progress indicator */}
          {renderProgress()}

          {/* Main content */}
          <div
            className={cn(
              'transition-opacity duration-200',
              isLoading && 'opacity-50',
              disabled && 'pointer-events-none opacity-50'
            )}
          >
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-8">
                  <CircleNotch className="h-8 w-8 animate-spin" />
                  <span className="ml-2 text-muted-foreground">Loading tool...</span>
                </div>
              }
            >
              {children}
            </Suspense>
          </div>

          {/* Action buttons */}
          {renderActionButtons()}
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Enhanced error boundary for tool components
 */
interface ToolErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ToolErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  toolName?: string;
}

export class ToolErrorBoundary extends React.Component<
  ToolErrorBoundaryProps,
  ToolErrorBoundaryState
> {
  constructor(props: ToolErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ToolErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Tool error in ${this.props.toolName || 'unknown tool'}:`, error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error ?? new Error('Unknown error')}
          reset={this.reset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default error fallback component
 */
const DefaultErrorFallback: React.FC<{ error: Error; reset: () => void }> = ({ error, reset }) => {
  return (
    <Card className="w-full">
      <CardContent className="py-8">
        <div className="space-y-4 text-center">
          <WarningCircle className="mx-auto h-12 w-12 text-destructive" />
          <div>
            <h3 className="font-semibold text-lg">Something went wrong</h3>
            <p className="text-muted-foreground">{error.message}</p>
          </div>
          <Button onClick={reset} variant="outline">
            <ArrowsClockwise className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ToolWrapper;
