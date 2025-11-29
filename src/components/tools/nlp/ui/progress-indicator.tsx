'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Activity,
  AlertCircle,
  Brain,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Layers,
  Loader2,
  Pause,
  Play,
  Square,
  XCircle,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

export interface ProcessingStep {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled';
  progress?: number;
  duration?: number;
  error?: string;
  metadata?: {
    operation?: string;
    model?: string;
    samples?: number;
    tokens?: number;
  };
}

export interface NLPProgressState {
  currentStep?: string;
  steps: ProcessingStep[];
  overallProgress: number;
  startTime?: Date;
  endTime?: Date;
  estimatedTimeRemaining?: number;
  canCancel?: boolean;
  canPause?: boolean;
  isPaused?: boolean;
  metadata?: {
    totalSamples?: number;
    processedSamples?: number;
    modelLoading?: boolean;
    preprocessing?: boolean;
    inference?: boolean;
    postprocessing?: boolean;
  };
}

interface NLPProgressIndicatorProps {
  state: NLPProgressState;
  onCancel?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  className?: string;
  showDetails?: boolean;
  showETA?: boolean;
  compact?: boolean;
  variant?: 'default' | 'minimal' | 'detailed';
}

const STEP_ICONS = {
  pending: Clock,
  running: Loader2,
  completed: CheckCircle,
  error: XCircle,
  cancelled: XCircle,
};

const STEP_COLORS = {
  pending: 'text-gray-500',
  running: 'text-blue-500',
  completed: 'text-green-500',
  error: 'text-red-500',
  cancelled: 'text-gray-400',
};

const OPERATION_ICONS = {
  'text-preprocessing': Layers,
  'model-loading': Database,
  'feature-extraction': Brain,
  inference: Zap,
  'post-processing': Activity,
  default: Cpu,
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatETA(seconds: number): string {
  if (seconds < 60) return `~${Math.round(seconds)}s`;
  if (seconds < 3600) return `~${Math.round(seconds / 60)}m`;
  return `~${Math.round(seconds / 3600)}h`;
}

function StepProgress({ step, isActive = false }: { step: ProcessingStep; isActive?: boolean }) {
  const Icon = STEP_ICONS[step.status];
  const colorClass = STEP_COLORS[step.status];
  const OperationIcon = step.metadata?.operation
    ? OPERATION_ICONS[step.metadata.operation as keyof typeof OPERATION_ICONS] ||
      OPERATION_ICONS.default
    : OPERATION_ICONS.default;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3 transition-all',
        isActive && 'border-primary bg-primary/5',
        step.status === 'error' && 'border-red-200 bg-red-50',
        step.status === 'completed' && 'border-green-200 bg-green-50'
      )}
    >
      <div className={cn('flex-shrink-0', colorClass)}>
        {step.status === 'running' ? (
          <Icon className="h-5 w-5 animate-spin" />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="truncate font-medium text-sm">{step.name}</span>
          {step.metadata?.operation && (
            <OperationIcon className="h-3 w-3 flex-shrink-0 text-gray-400" />
          )}
          {step.metadata?.model && (
            <Badge variant="outline" className="text-xs">
              {step.metadata.model}
            </Badge>
          )}
        </div>

        {step.description && <p className="mb-2 text-gray-600 text-xs">{step.description}</p>}

        {step.status === 'running' && typeof step.progress === 'number' && (
          <Progress value={step.progress} className="h-2" />
        )}

        {step.error && <p className="mt-1 text-red-600 text-xs">{step.error}</p>}

        {step.duration && (
          <p className="mt-1 text-gray-500 text-xs">Duration: {formatDuration(step.duration)}</p>
        )}
      </div>

      <div className="flex-shrink-0 text-right">
        {typeof step.progress === 'number' && step.status === 'running' && (
          <span className="font-medium text-sm">{Math.round(step.progress)}%</span>
        )}
        {step.metadata?.samples && (
          <div className="text-gray-500 text-xs">{step.metadata.samples} samples</div>
        )}
        {step.metadata?.tokens && (
          <div className="text-gray-500 text-xs">{step.metadata.tokens} tokens</div>
        )}
      </div>
    </div>
  );
}

export function NlpProgressIndicator({
  state,
  onCancel,
  onPause,
  onResume,
  className,
  showDetails = true,
  showETA = true,
  compact = false,
  variant = 'default',
}: NLPProgressIndicatorProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const currentStep = state.steps.find((step) => step.id === state.currentStep);
  const isRunning = currentStep?.status === 'running';
  const hasErrors = state.steps.some((step) => step.status === 'error');
  const isComplete = state.steps.every(
    (step) => step.status === 'completed' || step.status === 'cancelled'
  );

  const totalDuration =
    state.startTime && state.endTime
      ? state.endTime.getTime() - state.startTime.getTime()
      : state.startTime
        ? currentTime.getTime() - state.startTime.getTime()
        : 0;

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {isRunning ? (
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        ) : isComplete ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : hasErrors ? (
          <XCircle className="h-4 w-4 text-red-500" />
        ) : (
          <Clock className="h-4 w-4 text-gray-500" />
        )}
        <span className="text-sm">
          {currentStep?.name || 'Processing...'}
          {typeof state.overallProgress === 'number' && ` (${Math.round(state.overallProgress)}%)`}
        </span>
      </div>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="pt-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isRunning ? (
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            ) : isComplete ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : hasErrors ? (
              <XCircle className="h-6 w-6 text-red-500" />
            ) : (
              <Clock className="h-6 w-6 text-gray-500" />
            )}
            <div>
              <h3 className="font-semibold">
                {isComplete
                  ? 'Processing Complete'
                  : hasErrors
                    ? 'Processing Failed'
                    : currentStep?.name || 'NLP Processing'}
              </h3>
              {currentStep?.description && !compact && (
                <p className="text-gray-600 text-sm">{currentStep.description}</p>
              )}
            </div>
          </div>

          {/* Control Buttons */}
          {!isComplete && (
            <div className="flex items-center gap-2">
              {state.canPause && !state.isPaused && onPause && (
                <Button variant="outline" size="sm" onClick={onPause}>
                  <Pause className="h-4 w-4" />
                </Button>
              )}
              {state.canPause && state.isPaused && onResume && (
                <Button variant="outline" size="sm" onClick={onResume}>
                  <Play className="h-4 w-4" />
                </Button>
              )}
              {state.canCancel && onCancel && (
                <Button variant="outline" size="sm" onClick={onCancel}>
                  <Square className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Overall Progress */}
        {typeof state.overallProgress === 'number' && (
          <div className="mb-4">
            <div className="mb-2 flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(state.overallProgress)}%</span>
            </div>
            <Progress value={state.overallProgress} className="h-2" />
          </div>
        )}

        {/* Stats */}
        {!compact && (
          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="font-bold text-2xl text-blue-500">
                {state.steps.filter((s) => s.status === 'completed').length}
              </div>
              <div className="text-gray-500 text-xs">Completed</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl text-yellow-500">
                {state.steps.filter((s) => s.status === 'running').length}
              </div>
              <div className="text-gray-500 text-xs">Running</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl text-gray-500">
                {state.steps.filter((s) => s.status === 'pending').length}
              </div>
              <div className="text-gray-500 text-xs">Pending</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl">{formatDuration(totalDuration)}</div>
              <div className="text-gray-500 text-xs">Duration</div>
            </div>
          </div>
        )}

        {/* ETA */}
        {showETA && state.estimatedTimeRemaining && !isComplete && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 p-3">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-blue-700 text-sm">
              Estimated time remaining: {formatETA(state.estimatedTimeRemaining)}
            </span>
          </div>
        )}

        {/* Processing Steps */}
        {showDetails && state.steps.length > 0 && (
          <div className="space-y-2">
            <h4 className="mb-3 font-medium text-sm">Processing Steps</h4>
            {state.steps.map((step) => (
              <StepProgress key={step.id} step={step} isActive={step.id === state.currentStep} />
            ))}
          </div>
        )}

        {/* Metadata */}
        {!compact && state.metadata && (
          <div className="mt-4 border-t pt-4">
            <div className="flex flex-wrap gap-4 text-gray-500 text-xs">
              {state.metadata.totalSamples && (
                <span>
                  {' '}
                  Samples: {state.metadata.processedSamples || 0}/{state.metadata.totalSamples}
                </span>
              )}
              {state.metadata.modelLoading && <span>Model Loading</span>}
              {state.metadata.preprocessing && <span>Preprocessing</span>}
              {state.metadata.inference && <span>Inference</span>}
              {state.metadata.postprocessing && <span>Post-processing</span>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default NlpProgressIndicator;
