'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pause,
  Play,
  Square,
  Clock,
  Zap,
  Brain,
  Activity,
  Layers,
  Database,
  Cpu
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ProcessingStep {
  id: string
  name: string
  description?: string
  status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled'
  progress?: number
  duration?: number
  error?: string
  metadata?: {
    operation?: string
    model?: string
    samples?: number
    tokens?: number
  }
}

export interface NLPProgressState {
  currentStep?: string
  steps: ProcessingStep[]
  overallProgress: number
  startTime?: Date
  endTime?: Date
  estimatedTimeRemaining?: number
  canCancel?: boolean
  canPause?: boolean
  isPaused?: boolean
  metadata?: {
    totalSamples?: number
    processedSamples?: number
    modelLoading?: boolean
    preprocessing?: boolean
    inference?: boolean
    postprocessing?: boolean
  }
}

interface NLPProgressIndicatorProps {
  state: NLPProgressState
  onCancel?: () => void
  onPause?: () => void
  onResume?: () => void
  className?: string
  showDetails?: boolean
  showETA?: boolean
  compact?: boolean
  variant?: 'default' | 'minimal' | 'detailed'
}

const STEP_ICONS = {
  pending: Clock,
  running: Loader2,
  completed: CheckCircle,
  error: XCircle,
  cancelled: XCircle,
}

const STEP_COLORS = {
  pending: 'text-gray-500',
  running: 'text-blue-500',
  completed: 'text-green-500',
  error: 'text-red-500',
  cancelled: 'text-gray-400',
}

const OPERATION_ICONS = {
  'text-preprocessing': Layers,
  'model-loading': Database,
  'feature-extraction': Brain,
  'inference': Zap,
  'post-processing': Activity,
  'default': Cpu,
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

function formatETA(seconds: number): string {
  if (seconds < 60) return `~${Math.round(seconds)}s`
  if (seconds < 3600) return `~${Math.round(seconds / 60)}m`
  return `~${Math.round(seconds / 3600)}h`
}

function StepProgress({ step, isActive = false }: { step: ProcessingStep; isActive?: boolean }) {
  const Icon = STEP_ICONS[step.status]
  const colorClass = STEP_COLORS[step.status]
  const operationIcon = step.metadata?.operation ?
    OPERATION_ICONS[step.metadata.operation as keyof typeof OPERATION_ICONS] || OPERATION_ICONS.default :
    OPERATION_ICONS.default

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border transition-all',
      isActive && 'border-primary bg-primary/5',
      step.status === 'error' && 'border-red-200 bg-red-50',
      step.status === 'completed' && 'border-green-200 bg-green-50'
    )}>
      <div className={cn('flex-shrink-0', colorClass)}>
        {step.status === 'running' ? (
          <Icon className="h-5 w-5 animate-spin" />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm truncate">{step.name}</span>
          {step.metadata?.operation && (
            <operationIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
          )}
          {step.metadata?.model && (
            <Badge variant="outline" className="text-xs">
              {step.metadata.model}
            </Badge>
          )}
        </div>

        {step.description && (
          <p className="text-xs text-gray-600 mb-2">{step.description}</p>
        )}

        {step.status === 'running' && typeof step.progress === 'number' && (
          <Progress value={step.progress} className="h-2" />
        )}

        {step.error && (
          <p className="text-xs text-red-600 mt-1">{step.error}</p>
        )}

        {step.duration && (
          <p className="text-xs text-gray-500 mt-1">Duration: {formatDuration(step.duration)}</p>
        )}
      </div>

      <div className="flex-shrink-0 text-right">
        {typeof step.progress === 'number' && step.status === 'running' && (
          <span className="text-sm font-medium">{Math.round(step.progress)}%</span>
        )}
        {step.metadata?.samples && (
          <div className="text-xs text-gray-500">
            {step.metadata.samples} samples
          </div>
        )}
        {step.metadata?.tokens && (
          <div className="text-xs text-gray-500">
            {step.metadata.tokens} tokens
          </div>
        )}
      </div>
    </div>
  )
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
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const currentStep = state.steps.find(step => step.id === state.currentStep)
  const isRunning = currentStep?.status === 'running'
  const hasErrors = state.steps.some(step => step.status === 'error')
  const isComplete = state.steps.every(step => step.status === 'completed' || step.status === 'cancelled')

  const totalDuration = state.startTime && state.endTime
    ? state.endTime.getTime() - state.startTime.getTime()
    : state.startTime
    ? currentTime.getTime() - state.startTime.getTime()
    : 0

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
    )
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
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
                {isComplete ? 'Processing Complete' :
                 hasErrors ? 'Processing Failed' :
                 currentStep?.name || 'NLP Processing'}
              </h3>
              {currentStep?.description && !compact && (
                <p className="text-sm text-gray-600">{currentStep.description}</p>
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
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span>{Math.round(state.overallProgress)}%</span>
            </div>
            <Progress value={state.overallProgress} className="h-2" />
          </div>
        )}

        {/* Stats */}
        {!compact && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {state.steps.filter(s => s.status === 'completed').length}
              </div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {state.steps.filter(s => s.status === 'running').length}
              </div>
              <div className="text-xs text-gray-500">Running</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-500">
                {state.steps.filter(s => s.status === 'pending').length}
              </div>
              <div className="text-xs text-gray-500">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatDuration(totalDuration)}
              </div>
              <div className="text-xs text-gray-500">Duration</div>
            </div>
          </div>
        )}

        {/* ETA */}
        {showETA && state.estimatedTimeRemaining && !isComplete && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-blue-700">
              Estimated time remaining: {formatETA(state.estimatedTimeRemaining)}
            </span>
          </div>
        )}

        {/* Processing Steps */}
        {showDetails && state.steps.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm mb-3">Processing Steps</h4>
            {state.steps.map((step) => (
              <StepProgress
                key={step.id}
                step={step}
                isActive={step.id === state.currentStep}
              />
            ))}
          </div>
        )}

        {/* Metadata */}
        {!compact && state.metadata && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              {state.metadata.totalSamples && (
                <span> Samples: {state.metadata.processedSamples || 0}/{state.metadata.totalSamples}</span>
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
  )
}

export default NlpProgressIndicator
