/**
 * Progress Tracking System for Error Recovery
 * Tracks and visualizes progress through multi-step recovery processes
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  BarChart3,
  Activity,
  Zap,
  Target,
  Timer,
  TrendingUp,
  Award,
  Star,
  ChevronRight,
  ChevronLeft,
  Loader2,
  FileText,
  Settings,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ErrorInfo, RecoveryStep, RecoveryStrategy } from "@/lib/error-recovery";

export interface ProgressStep {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  result?: any;
  error?: string;
  retryCount?: number;
  metadata?: {
    difficulty?: 'easy' | 'medium' | 'hard';
    category?: string;
    estimatedTime?: number;
    actualTime?: number;
    successRate?: number;
  };
}

export interface RecoveryProgress {
  sessionId: string;
  errorId: string;
  strategy: RecoveryStrategy;
  steps: ProgressStep[];
  overallStatus: 'pending' | 'in_progress' | 'completed' | 'failed' | 'paused';
  startTime: Date;
  endTime?: Date;
  totalDuration?: number;
  metrics: ProgressMetrics;
  metadata: {
    userId?: string;
    toolId?: string;
    category?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface ProgressMetrics {
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  inProgressSteps: number;
  averageStepTime: number;
  estimatedTimeRemaining: number;
  successRate: number;
  retryRate: number;
  efficiency: number;
  progressPercentage: number;
}

export interface ProgressTrackerProps {
  progress: RecoveryProgress;
  onStepRetry?: (stepId: string) => void;
  onStepSkip?: (stepId: string) => void;
  onPause?: () => void;
  onResume?: () => void;
  onReset?: () => void;
  className?: string;
  compact?: boolean;
  showDetails?: boolean;
  showMetrics?: boolean;
  realTimeUpdates?: boolean;
}

export interface ProgressVisualizationProps {
  progress: RecoveryProgress;
  type: 'linear' | 'circular' | 'timeline' | 'heatmap' | 'milestones';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  showTimes?: boolean;
  animated?: boolean;
  className?: string;
}

export interface ProgressHistory {
  sessionId: string;
  timestamp: Date;
  action: 'start' | 'complete' | 'fail' | 'skip' | 'retry' | 'pause' | 'resume';
  stepId?: string;
  details?: string;
  metadata?: any;
}

/**
 * Main Progress Tracker Component
 */
export function ProgressTracker({
  progress,
  onStepRetry,
  onStepSkip,
  onPause,
  onResume,
  onReset,
  className,
  compact = false,
  showDetails = true,
  showMetrics = true,
  realTimeUpdates = true,
}: ProgressTrackerProps) {
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [history, setHistory] = useState<ProgressHistory[]>([]);
  const [realTimeMetrics, setRealTimeMetrics] = useState(progress.metrics);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Real-time updates
  useEffect(() => {
    if (realTimeUpdates && progress.overallStatus === 'in_progress') {
      intervalRef.current = setInterval(() => {
        updateMetrics();
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [realTimeUpdates, progress.overallStatus]);

  const updateMetrics = useCallback(() => {
    const now = new Date();
    const updatedProgress = calculateMetrics(progress);
    setRealTimeMetrics(updatedProgress.metrics);

    // Add history entry for significant events
    if (progress.steps.some(s => s.status === 'completed' && !s.endTime)) {
      const completedStep = progress.steps.find(s => s.status === 'completed' && !s.endTime);
      if (completedStep) {
        addHistory({
          sessionId: progress.sessionId,
          timestamp: now,
          action: 'complete',
          stepId: completedStep.id,
          details: `Completed step: ${completedStep.title}`,
        });
      }
    }
  }, [progress]);

  const calculateMetrics = (progressData: RecoveryProgress): RecoveryProgress => {
    const now = new Date();
    const totalSteps = progressData.steps.length;
    const completedSteps = progressData.steps.filter(s => s.status === 'completed').length;
    const failedSteps = progressData.steps.filter(s => s.status === 'failed').length;
    const skippedSteps = progressData.steps.filter(s => s.status === 'skipped').length;
    const inProgressSteps = progressData.steps.filter(s => s.status === 'in_progress').length;

    const averageStepTime = progressData.steps
      .filter(s => s.duration)
      .reduce((sum, s) => sum + (s.duration || 0), 0) / Math.max(1, completedSteps);

    const remainingSteps = totalSteps - completedSteps - failedSteps - skippedSteps;
    const estimatedTimeRemaining = remainingSteps * averageStepTime;

    const successRate = completedSteps > 0 ? (completedSteps / (completedSteps + failedSteps)) * 100 : 0;
    const retryRate = progressData.steps.reduce((sum, s) => sum + (s.retryCount || 0), 0) / Math.max(1, totalSteps);

    const efficiency = successRate * (1 - retryRate / 10); // Efficiency considers both success and retries
    const progressPercentage = ((completedSteps + skippedSteps) / totalSteps) * 100;

    const totalDuration = progressData.endTime
      ? progressData.endTime.getTime() - progressData.startTime.getTime()
      : now.getTime() - progressData.startTime.getTime();

    const metrics: ProgressMetrics = {
      totalSteps,
      completedSteps,
      failedSteps,
      skippedSteps,
      inProgressSteps,
      averageStepTime,
      estimatedTimeRemaining,
      successRate,
      retryRate,
      efficiency,
      progressPercentage,
    };

    return {
      ...progressData,
      metrics,
      totalDuration,
    };
  };

  const addHistory = useCallback((entry: ProgressHistory) => {
    setHistory(prev => [...prev, entry]);
  }, []);

  const getStatusColor = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100 border-green-200';
      case 'failed': return 'text-red-600 bg-red-100 border-red-200';
      case 'in_progress': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'skipped': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'pending': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'in_progress': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'skipped': return <SkipForward className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (compact) {
    return (
      <Card className={cn("border-l-4 border-blue-200 bg-blue-50", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {progress.overallStatus === 'in_progress' ? (
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              ) : progress.overallStatus === 'completed' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Activity className="h-5 w-5 text-blue-600" />
              )}
              <div>
                <h4 className="font-medium text-blue-800">Recovery Progress</h4>
                <p className="text-sm text-blue-600">
                  {realTimeMetrics.completedSteps}/{realTimeMetrics.totalSteps} steps completed
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-1">
                {Math.round(realTimeMetrics.progressPercentage)}%
              </Badge>
              <div className="text-xs text-blue-600">
                {formatDuration(realTimeMetrics.estimatedTimeRemaining)} remaining
              </div>
            </div>
          </div>
          <Progress value={realTimeMetrics.progressPercentage} className="h-2 mt-3" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recovery Progress
              </CardTitle>
              <CardDescription>
                Session {progress.sessionId} • {progress.metadata.category}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={progress.overallStatus === 'completed' ? 'default' : 'secondary'}>
                {progress.overallStatus.replace('_', ' ')}
              </Badge>
              <div className="flex gap-1">
                {onPause && progress.overallStatus === 'in_progress' && (
                  <Button size="sm" variant="outline" onClick={onPause}>
                    <Pause className="h-3 w-3 mr-1" />
                    Pause
                  </Button>
                )}
                {onResume && progress.overallStatus === 'paused' && (
                  <Button size="sm" variant="outline" onClick={onResume}>
                    <Play className="h-3 w-3 mr-1" />
                    Resume
                  </Button>
                )}
                {onReset && (
                  <Button size="sm" variant="outline" onClick={onReset}>
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {realTimeMetrics.completedSteps}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {realTimeMetrics.inProgressSteps}
              </div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(realTimeMetrics.successRate)}%
              </div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatDuration(realTimeMetrics.estimatedTimeRemaining)}
              </div>
              <div className="text-sm text-muted-foreground">Est. Remaining</div>
            </div>
          </div>
          <Progress value={realTimeMetrics.progressPercentage} className="h-3" />
          <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
            <span>{Math.round(realTimeMetrics.progressPercentage)}% Complete</span>
            <span>
              Started {progress.startTime.toLocaleTimeString()} •
              {progress.totalDuration && ` ${formatDuration(progress.totalDuration)} elapsed`}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Step Progress */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Step Details
            </CardTitle>
            <CardDescription>
              Individual step status and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {progress.steps.map((step, index) => {
                const isSelected = selectedStep === step.id;
                const stepProgress = step.metadata?.actualTime && step.metadata?.estimatedTime
                  ? (step.metadata.actualTime / step.metadata.estimatedTime) * 100
                  : 0;

                return (
                  <div
                    key={step.id}
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-all",
                      isSelected && "border-blue-200 bg-blue-50",
                      getStatusColor(step.status)
                    )}
                    onClick={() => setSelectedStep(isSelected ? null : step.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-current">
                          <div className="text-sm font-medium">{index + 1}</div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(step.status)}
                            <h4 className="font-medium">{step.title}</h4>
                            {step.retryCount && step.retryCount > 0 && (
                              <Badge variant="outline" className="text-xs">
                                Retry #{step.retryCount}
                              </Badge>
                            )}
                          </div>
                          {step.metadata?.category && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {step.metadata.category}
                            </Badge>
                          )}

                          {step.duration && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                              <Timer className="h-3 w-3" />
                              <span>{formatDuration(step.duration)}</span>
                              {step.metadata?.estimatedTime && (
                                <span>vs est. {formatDuration(step.metadata.estimatedTime)}</span>
                              )}
                            </div>
                          )}

                          {step.error && (
                            <Alert className="mt-2" variant="destructive">
                              <AlertDescription className="text-sm">
                                {step.error}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {step.status === 'failed' && onStepRetry && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onStepRetry(step.id);
                                  }}
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Retry this step</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {step.status === 'pending' && onStepSkip && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onStepSkip(step.id);
                                  }}
                                >
                                  <SkipForward className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Skip this step</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>

                    {/* Step progress bar */}
                    {step.metadata?.estimatedTime && (
                      <div className="mt-3">
                        <Progress value={stepProgress} className="h-1" />
                        <div className="text-xs text-muted-foreground mt-1">
                          Time progress: {Math.round(stepProgress)}%
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      {showMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
            <CardDescription>
              Recovery process efficiency and performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Efficiency Score */}
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-2 rounded-full bg-blue-100">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-2xl font-bold">
                  {Math.round(realTimeMetrics.efficiency)}
                </div>
                <div className="text-sm text-muted-foreground">Efficiency Score</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${realTimeMetrics.efficiency}%` }}
                  />
                </div>
              </div>

              {/* Average Step Time */}
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-2 rounded-full bg-green-100">
                  <Clock className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-2xl font-bold">
                  {formatDuration(realTimeMetrics.averageStepTime)}
                </div>
                <div className="text-sm text-muted-foreground">Avg. Step Time</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {realTimeMetrics.completedSteps} steps measured
                </div>
              </div>

              {/* Retry Rate */}
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-2 rounded-full bg-yellow-100">
                  <RotateCcw className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold">
                  {realTimeMetrics.retryRate.toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Avg. Retries</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Per step
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Key Insights */}
            <div>
              <h4 className="font-medium mb-3">Key Insights</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {realTimeMetrics.successRate > 80 && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
                    <Award className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800">
                      High success rate: {Math.round(realTimeMetrics.successRate)}%
                    </span>
                  </div>
                )}
                {realTimeMetrics.retryRate < 0.5 && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      Low retry rate: {realTimeMetrics.retryRate.toFixed(1)}
                    </span>
                  </div>
                )}
                {realTimeMetrics.efficiency > 70 && (
                  <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded">
                    <Star className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-purple-800">
                      Excellent efficiency: {Math.round(realTimeMetrics.efficiency)}%
                    </span>
                  </div>
                )}
                {realTimeMetrics.estimatedTimeRemaining < 30000 && (
                  <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded">
                    <Target className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-orange-800">
                      Almost complete: less than 30s remaining
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline View */}
      <ProgressVisualization
        progress={progress}
        type="timeline"
        size="lg"
        showLabels={true}
        showTimes={true}
        animated={realTimeUpdates}
      />
    </div>
  );
}

/**
 * Progress Visualization Component
 */
export function ProgressVisualization({
  progress,
  type,
  size = 'md',
  showLabels = true,
  showTimes = true,
  animated = false,
  className,
}: ProgressVisualizationProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'h-2';
      case 'md': return 'h-3';
      case 'lg': return 'h-4';
      default: return 'h-3';
    }
  };

  if (type === 'linear') {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <Progress
            value={progress.metrics.progressPercentage}
            className={cn("w-full", getSizeClasses())}
          />
          {showLabels && (
            <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
              <span>{progress.metrics.completedSteps} completed</span>
              <span>{Math.round(progress.metrics.progressPercentage)}%</span>
              <span>{progress.metrics.totalSteps - progress.metrics.completedSteps} remaining</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (type === 'timeline') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Recovery Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

            {/* Timeline items */}
            <div className="space-y-4">
              {progress.steps.map((step, index) => {
                const isCompleted = step.status === 'completed';
                const isCurrent = step.status === 'in_progress';
                const isFailed = step.status === 'failed';

                return (
                  <div key={step.id} className="flex items-start gap-4">
                    {/* Timeline dot */}
                    <div className={cn(
                      "relative z-10 w-12 h-12 rounded-full border-4 bg-white flex items-center justify-center",
                      isCompleted && "border-green-500",
                      isCurrent && "border-blue-500",
                      isFailed && "border-red-500",
                      !isCompleted && !isCurrent && !isFailed && "border-gray-300"
                    )}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : isCurrent ? (
                        <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                      ) : isFailed ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-400" />
                      )}
                    </div>

                    {/* Step details */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{step.title}</h4>
                        {showTimes && step.startTime && (
                          <span className="text-sm text-muted-foreground">
                            {step.startTime.toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs mt-1",
                          isCompleted && "border-green-200 text-green-700",
                          isCurrent && "border-blue-200 text-blue-700",
                          isFailed && "border-red-200 text-red-700"
                        )}
                      >
                        {step.status.replace('_', ' ')}
                      </Badge>
                      {step.duration && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Duration: {(step.duration / 1000).toFixed(1)}s
                        </div>
                      )}
                      {step.error && (
                        <Alert className="mt-2" variant="destructive">
                          <AlertDescription className="text-xs">
                            {step.error}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default fallback
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <Progress value={progress.metrics.progressPercentage} />
      </CardContent>
    </Card>
  );
}

export default {
  ProgressTracker,
  ProgressVisualization,
};
