import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  MemoryStick,
  Play,
  RotateCcw,
  Square,
  Terminal,
  Timer,
  XCircle,
  Zap,
} from 'lucide-react';
import * as React from 'react';
import type { ExecutionStatus, ExecutionStatusProps } from './code-types';

interface ExecutionStatusComponentProps extends ExecutionStatusProps {
  showDetails?: boolean;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'detailed';
  onCancel?: () => void;
  onRetry?: () => void;
}

export function ExecutionStatus({
  status,
  progress = 0,
  executionTime = 0,
  memoryUsage = 0,
  error,
  onCancel,
  onRetry,
  compact = false,
  showDetails = true,
  animated = true,
  size = 'md',
  variant = 'default',
  className,
}: ExecutionStatusComponentProps) {
  const [currentTime, setCurrentTime] = React.useState(0);

  // Update current time during execution
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (status === 'compiling' || status === 'running') {
      interval = setInterval(() => {
        setCurrentTime((prev) => prev + 100);
      }, 100);
    } else {
      setCurrentTime(executionTime);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status, executionTime]);

  const getStatusIcon = () => {
    const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';

    switch (status) {
      case 'idle':
        return <Play className={cn(iconSize, 'text-gray-500')} />;
      case 'compiling':
        return <Terminal className={cn(iconSize, 'text-blue-500', animated && 'animate-pulse')} />;
      case 'running':
        return <Loader2 className={cn(iconSize, 'text-green-500', animated && 'animate-spin')} />;
      case 'completed':
        return <CheckCircle className={cn(iconSize, 'text-green-500')} />;
      case 'error':
        return <XCircle className={cn(iconSize, 'text-red-500')} />;
      case 'timeout':
        return <Timer className={cn(iconSize, 'text-orange-500')} />;
      case 'cancelled':
        return <Square className={cn(iconSize, 'text-yellow-500')} />;
      default:
        return <Clock className={cn(iconSize, 'text-gray-500')} />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Ready to run';
      case 'compiling':
        return 'Compiling...';
      case 'running':
        return 'Running...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      case 'timeout':
        return 'Timeout';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'idle':
        return 'default';
      case 'compiling':
        return 'secondary';
      case 'running':
        return 'secondary';
      case 'completed':
        return 'default';
      case 'error':
        return 'destructive';
      case 'timeout':
        return 'destructive';
      case 'cancelled':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  const formatMemory = (kb: number) => {
    if (kb < 1024) return `${kb}KB`;
    if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(2)}MB`;
    return `${(kb / (1024 * 1024)).toFixed(2)}GB`;
  };

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {getStatusIcon()}
        <span
          className={cn(
            'font-medium text-sm',
            status === 'error' && 'text-red-600',
            status === 'completed' && 'text-green-600',
            status === 'running' && 'text-blue-600'
          )}
        >
          {getStatusText()}
        </span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={cn('flex items-center justify-between rounded-lg border p-3', className)}>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium">{getStatusText()}</span>
        </div>

        {status === 'running' && (
          <div className="flex items-center gap-2 text-gray-600 text-sm dark:text-gray-400">
            <Clock className="h-4 w-4" />
            {formatTime(currentTime)}
          </div>
        )}

        {status === 'completed' && (
          <div className="flex items-center gap-4 text-gray-600 text-sm dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatTime(executionTime)}
            </div>
            <div className="flex items-center gap-1">
              <MemoryStick className="h-4 w-4" />
              {formatMemory(memoryUsage)}
            </div>
          </div>
        )}

        {(status === 'running' || status === 'compiling') && onCancel && (
          <Button variant="outline" size="sm" onClick={onCancel}>
            <Square className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        )}

        {status === 'error' && onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Status Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <h3 className="font-medium">Execution Status</h3>
                <p className="text-gray-600 text-sm dark:text-gray-400">{getStatusText()}</p>
              </div>
            </div>

            <Badge variant={getStatusColor() as any}>{status.toUpperCase()}</Badge>
          </div>

          {/* Progress Bar */}
          {(status === 'compiling' || status === 'running') && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{status === 'compiling' ? 'Compiling' : 'Running'}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Execution Details */}
          {showDetails && status !== 'idle' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Execution Time */}
              {(status === 'running' ||
                status === 'completed' ||
                status === 'error' ||
                status === 'timeout') && (
                <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium text-sm">Execution Time</div>
                    <div className="text-gray-600 text-xs dark:text-gray-400">
                      {formatTime(status === 'running' ? currentTime : executionTime)}
                    </div>
                  </div>
                </div>
              )}

              {/* Memory Usage */}
              {(status === 'running' || status === 'completed' || status === 'error') &&
                memoryUsage > 0 && (
                  <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <MemoryStick className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium text-sm">Memory Usage</div>
                      <div className="text-gray-600 text-xs dark:text-gray-400">
                        {formatMemory(memoryUsage)}
                      </div>
                    </div>
                  </div>
                )}

              {/* Performance Metrics */}
              {status === 'completed' && (
                <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="font-medium text-sm">Performance</div>
                    <div className="text-gray-600 text-xs dark:text-gray-400">Optimal</div>
                  </div>
                </div>
              )}

              {/* Status Specific Info */}
              {status === 'timeout' && (
                <div className="flex items-center gap-3 rounded-lg bg-orange-50 p-3 dark:bg-orange-900/20">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <div>
                    <div className="font-medium text-sm">Timeout</div>
                    <div className="text-gray-600 text-xs dark:text-gray-400">
                      Execution exceeded time limit
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {status === 'error' && error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <div className="flex items-start gap-2">
                <XCircle className="mt-0.5 h-5 w-5 text-red-500" />
                <div className="flex-1">
                  <div className="font-medium text-red-800 dark:text-red-200">Error</div>
                  <div className="mt-1 text-red-700 text-sm dark:text-red-300">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {(status === 'running' || status === 'compiling') && onCancel && (
              <Button variant="outline" onClick={onCancel}>
                <Square className="mr-2 h-4 w-4" />
                Cancel Execution
              </Button>
            )}

            {(status === 'error' || status === 'timeout') && onRetry && (
              <Button onClick={onRetry}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Progress indicator for specific operations
export function ExecutionProgress({
  status,
  progress,
  currentStep,
  totalSteps,
  stepName,
  className,
}: {
  status: ExecutionStatus;
  progress: number;
  currentStep?: number;
  totalSteps?: number;
  stepName?: string;
  className?: string;
}) {
  const getStepText = () => {
    if (currentStep !== undefined && totalSteps !== undefined) {
      return `Step ${currentStep} of ${totalSteps}`;
    }
    return stepName || '';
  };

  if (status === 'idle' || status === 'completed' || status === 'error') {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between text-sm">
        <span>{status === 'compiling' ? 'Compiling' : 'Running'}</span>
        {getStepText() && <span>{getStepText()}</span>}
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}

// Quick status indicator for inline use
export function QuickStatus({
  status,
  size = 'sm',
  className,
}: {
  status: ExecutionStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  const getStatusColor = () => {
    switch (status) {
      case 'idle':
        return 'text-gray-500';
      case 'compiling':
        return 'text-blue-500';
      case 'running':
        return 'text-green-500';
      case 'completed':
        return 'text-green-600';
      case 'error':
        return 'text-red-500';
      case 'timeout':
        return 'text-orange-500';
      case 'cancelled':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'idle':
        return <Play className={cn(iconSize, getStatusColor())} />;
      case 'compiling':
        return <Terminal className={cn(iconSize, getStatusColor(), 'animate-pulse')} />;
      case 'running':
        return <Loader2 className={cn(iconSize, getStatusColor(), 'animate-spin')} />;
      case 'completed':
        return <CheckCircle className={cn(iconSize, getStatusColor())} />;
      case 'error':
        return <XCircle className={cn(iconSize, getStatusColor())} />;
      case 'timeout':
        return <Timer className={cn(iconSize, getStatusColor())} />;
      case 'cancelled':
        return <Square className={cn(iconSize, getStatusColor())} />;
      default:
        return <Clock className={cn(iconSize, getStatusColor())} />;
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {getStatusIcon()}
      <span className={cn('font-medium text-sm', getStatusColor())}>{status}</span>
    </div>
  );
}
