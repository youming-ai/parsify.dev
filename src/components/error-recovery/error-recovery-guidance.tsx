/**
 * Error Recovery Guidance System
 * Interactive step-by-step guidance for recovering from errors in Parsify.dev tools
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  Copy,
  BookOpen,
  Video,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Info,
  RefreshCw,
  Clock,
  Target,
  Zap,
  Shield,
  FileText,
  Terminal,
  Code,
  Database,
  Globe,
  Lock,
  Type,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ErrorInfo, RecoveryStep, RecoveryStrategy } from "@/lib/error-recovery";

export interface ErrorRecoveryGuidanceProps {
  error: ErrorInfo;
  strategy: RecoveryStrategy | null;
  onStepComplete?: (step: RecoveryStep, result: any) => void;
  onRecoveryComplete?: (result: any) => void;
  onDismiss?: () => void;
  className?: string;
  autoStart?: boolean;
  compact?: boolean;
}

export interface StepExecutionState {
  stepId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  result?: any;
  error?: string;
  userAction?: string;
}

export interface GuidanceState {
  currentStepIndex: number;
  steps: StepExecutionState[];
  isPlaying: boolean;
  isCompleted: boolean;
  totalProgress: number;
  estimatedTimeRemaining: number;
  startTime?: Date;
  completedTime?: Date;
}

// Category-specific guidance templates
const categoryGuidance = {
  'JSON Processing': {
    icon: FileText,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    commonErrors: [
      'Invalid JSON syntax',
      'Missing commas or brackets',
      'Unmatched quotes',
      'Trailing commas',
      'Invalid escape sequences'
    ],
    quickFixes: [
      'Use JSON Validator tool',
      'Format with JSON Formatter',
      'Check for common syntax issues',
      'Use online JSON linter'
    ]
  },
  'Code Execution': {
    icon: Terminal,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    commonErrors: [
      'Syntax errors',
      'Runtime exceptions',
      'Timeout errors',
      'Memory limits exceeded',
      'Invalid input data'
    ],
    quickFixes: [
      'Check code syntax',
      'Reduce complexity',
      'Validate input data',
      'Use try-catch blocks'
    ]
  },
  'File Processing': {
    icon: Database,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    commonErrors: [
      'File too large',
      'Unsupported format',
      'Corrupted file',
      'Permission denied',
      'Encoding issues'
    ],
    quickFixes: [
      'Compress large files',
      'Convert to supported format',
      'Check file permissions',
      'Try different encoding'
    ]
  },
  'Network Tools': {
    icon: Globe,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    commonErrors: [
      'Connection timeout',
      'DNS resolution failed',
      'SSL certificate errors',
      'Rate limiting',
      'Invalid URLs'
    ],
    quickFixes: [
      'Check internet connection',
      'Verify URL format',
      'Try different endpoint',
      'Check firewall settings'
    ]
  },
  'Text Processing': {
    icon: Type,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    commonErrors: [
      'Encoding issues',
      'Invalid regex patterns',
      'Text too long',
      'Invalid encoding',
      'Malformed input'
    ],
    quickFixes: [
      'Check text encoding',
      'Validate regex patterns',
      'Split long text',
      'Use proper escape sequences'
    ]
  },
  'Security Tools': {
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    commonErrors: [
      'Invalid input format',
      'Unsupported hash algorithm',
      'Encryption errors',
      'Permission denied',
      'Invalid certificate'
    ],
    quickFixes: [
      'Verify input format',
      'Use supported algorithms',
      'Check permissions',
      'Validate certificates'
    ]
  }
};

/**
 * Main Error Recovery Guidance Component
 */
export function ErrorRecoveryGuidance({
  error,
  strategy,
  onStepComplete,
  onRecoveryComplete,
  onDismiss,
  className,
  autoStart = false,
  compact = false,
}: ErrorRecoveryGuidanceProps) {
  const [guidanceState, setGuidanceState] = useState<GuidanceState>({
    currentStepIndex: 0,
    steps: [],
    isPlaying: false,
    isCompleted: false,
    totalProgress: 0,
    estimatedTimeRemaining: 0,
  });

  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'steps' | 'overview' | 'alternatives'>('steps');

  // Initialize steps when strategy changes
  useEffect(() => {
    if (strategy) {
      const steps = strategy.steps.map(step => ({
        stepId: step.id,
        status: 'pending' as const,
      }));

      setGuidanceState(prev => ({
        ...prev,
        currentStepIndex: 0,
        steps,
        isPlaying: autoStart,
        isCompleted: false,
        totalProgress: 0,
        estimatedTimeRemaining: strategy.steps.reduce((sum, step) => sum + (step.estimatedTime || 30), 0),
        startTime: autoStart ? new Date() : undefined,
      }));
    }
  }, [strategy, autoStart]);

  // Auto-advance steps when playing
  useEffect(() => {
    if (guidanceState.isPlaying && strategy) {
      const currentStep = strategy.steps[guidanceState.currentStepIndex];
      const currentStepState = guidanceState.steps[guidanceState.currentStepIndex];

      if (currentStep && currentStepState?.status === 'pending') {
        const timer = setTimeout(() => {
          executeStep(currentStep);
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, [guidanceState.isPlaying, guidanceState.currentStepIndex, strategy]);

  const executeStep = useCallback(async (step: RecoveryStep) => {
    setGuidanceState(prev => ({
      ...prev,
      steps: prev.steps.map(s =>
        s.stepId === step.id
          ? { ...s, status: 'in_progress', startTime: new Date() }
          : s
      ),
    }));

    try {
      // Simulate step execution (this would be actual implementation)
      const result = await simulateStepExecution(step);

      setGuidanceState(prev => {
        const newSteps = prev.steps.map(s =>
          s.stepId === step.id
            ? { ...s, status: 'completed', endTime: new Date(), result }
            : s
        );

        const nextIndex = prev.currentStepIndex + 1;
        const isCompleted = nextIndex >= (strategy?.steps.length || 0);
        const progress = (newSteps.filter(s => s.status === 'completed').length / newSteps.length) * 100;

        return {
          ...prev,
          steps: newSteps,
          currentStepIndex: isCompleted ? prev.currentStepIndex : nextIndex,
          isCompleted,
          totalProgress: progress,
          estimatedTimeRemaining: isCompleted ? 0 : Math.max(0, prev.estimatedTimeRemaining - (step.estimatedTime || 30)),
          isPlaying: !isCompleted && prev.isPlaying,
          completedTime: isCompleted ? new Date() : undefined,
        };
      });

      onStepComplete?.(step, result);

      if (guidanceState.currentStepIndex === (strategy?.steps.length || 0) - 1) {
        onRecoveryComplete?.({ success: true, steps: guidanceState.steps });
      }
    } catch (error) {
      setGuidanceState(prev => ({
        ...prev,
        steps: prev.steps.map(s =>
          s.stepId === step.id
            ? { ...s, status: 'failed', endTime: new Date(), error: (error as Error).message }
            : s
        ),
        isPlaying: false,
      }));
    }
  }, [guidanceState.currentStepIndex, guidanceState.steps, onStepComplete, onRecoveryComplete, strategy]);

  const simulateStepExecution = async (step: RecoveryStep): Promise<any> => {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, (step.estimatedTime || 30) * 100));

    // Simulate different results based on step type
    switch (step.type) {
      case 'automatic':
        return { success: true, message: `Automatic step "${step.title}" completed successfully` };
      case 'manual':
        return {
          success: false,
          message: `Manual step "${step.title}" requires user intervention`,
          requiresAction: true
        };
      case 'suggested':
        return {
          success: false,
          message: `Suggested step "${step.title}" for user consideration`,
          isSuggestion: true
        };
      default:
        return { success: true, message: `Step "${step.title}" processed` };
    }
  };

  const handleStepAction = useCallback((stepId: string, action: string) => {
    setGuidanceState(prev => ({
      ...prev,
      steps: prev.steps.map(s =>
        s.stepId === stepId
          ? { ...s, userAction: action, status: 'completed', endTime: new Date() }
          : s
      ),
    }));
  }, []);

  const goToStep = useCallback((stepIndex: number) => {
    if (strategy && stepIndex >= 0 && stepIndex < strategy.steps.length) {
      setGuidanceState(prev => ({
        ...prev,
        currentStepIndex: stepIndex,
      }));
    }
  }, [strategy]);

  const togglePlayback = useCallback(() => {
    setGuidanceState(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying,
      startTime: !prev.isPlaying && !prev.startTime ? new Date() : prev.startTime,
    }));
  }, []);

  const resetGuidance = useCallback(() => {
    if (strategy) {
      const steps = strategy.steps.map(step => ({
        stepId: step.id,
        status: 'pending' as const,
      }));

      setGuidanceState({
        currentStepIndex: 0,
        steps,
        isPlaying: false,
        isCompleted: false,
        totalProgress: 0,
        estimatedTimeRemaining: strategy.steps.reduce((sum, step) => sum + (step.estimatedTime || 30), 0),
      });
    }
  }, [strategy]);

  const getCategoryInfo = () => {
    if (error.context) {
      for (const [category, info] of Object.entries(categoryGuidance)) {
        if (error.context?.toLowerCase().includes(category.toLowerCase())) {
          return { category, ...info };
        }
      }
    }
    return null;
  };

  const categoryInfo = getCategoryInfo();

  if (compact) {
    return (
      <Card className={cn("border-l-4 border-blue-200 bg-blue-50", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-800">Recovery Guidance Available</h4>
              <p className="text-sm text-blue-600">
                {strategy?.steps.length || 0} steps to resolve this issue
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setActiveTab('steps')}>
              Start Recovery
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {categoryInfo ? (
                <categoryInfo.icon className={cn("h-6 w-6", categoryInfo.color)} />
              ) : (
                <HelpCircle className="h-6 w-6 text-blue-600" />
              )}
              <div>
                <CardTitle className="text-xl">Error Recovery Guidance</CardTitle>
                <CardDescription>
                  Step-by-step instructions to resolve: {error.message}
                </CardDescription>
              </div>
            </div>
            {onDismiss && (
              <Button size="sm" variant="ghost" onClick={onDismiss}>
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Category-specific quick help */}
      {categoryInfo && (
        <Card className={cn("border-l-4", categoryInfo.borderColor, categoryInfo.bgColor)}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <categoryInfo.icon className={cn("h-5 w-5", categoryInfo.color)} />
              <h4 className="font-medium">{categoryInfo.category} Tools</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-sm font-medium mb-2">Common Issues:</h5>
                <ul className="text-sm space-y-1">
                  {categoryInfo.commonErrors.map((issue, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertTriangle className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="text-sm font-medium mb-2">Quick Fixes:</h5>
                <ul className="text-sm space-y-1">
                  {categoryInfo.quickFixes.map((fix, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Zap className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                      {fix}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recovery Progress</CardTitle>
              <CardDescription>
                {guidanceState.isCompleted
                  ? "Recovery completed successfully"
                  : guidanceState.isPlaying
                    ? `Step ${guidanceState.currentStepIndex + 1} of ${strategy?.steps.length || 0} in progress`
                    : `Ready to start recovery process`
                }
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {guidanceState.estimatedTimeRemaining > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  ~{Math.ceil(guidanceState.estimatedTimeRemaining)}s
                </Badge>
              )}
              <Badge variant={guidanceState.isCompleted ? "default" : "secondary"}>
                {Math.round(guidanceState.totalProgress)}% Complete
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={guidanceState.totalProgress} className="h-2" />
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={togglePlayback}
                disabled={guidanceState.isCompleted}
              >
                {guidanceState.isPlaying ? (
                  <Pause className="h-3 w-3 mr-1" />
                ) : (
                  <Play className="h-3 w-3 mr-1" />
                )}
                {guidanceState.isPlaying ? "Pause" : "Start"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={resetGuidance}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {strategy?.steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full",
                    index < guidanceState.currentStepIndex
                      ? "bg-green-500"
                      : index === guidanceState.currentStepIndex
                        ? "bg-blue-500"
                        : "bg-gray-300"
                  )}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="steps">Step-by-Step</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
        </TabsList>

        <TabsContent value="steps" className="space-y-4">
          {strategy?.steps.map((step, index) => {
            const stepState = guidanceState.steps[index];
            const isActive = index === guidanceState.currentStepIndex;
            const isCompleted = stepState?.status === 'completed';
            const isFailed = stepState?.status === 'failed';
            const isInProgress = stepState?.status === 'in_progress';

            return (
              <Card
                key={step.id}
                className={cn(
                  "transition-all duration-200",
                  isActive && "border-blue-200 bg-blue-50 shadow-md",
                  isCompleted && "border-green-200 bg-green-50",
                  isFailed && "border-red-200 bg-red-50",
                  !isActive && !isCompleted && !isFailed && "opacity-75"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{step.title}</CardTitle>
                        <CardDescription>{step.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={step.type === 'automatic' ? 'default' : 'secondary'}>
                        {step.type}
                      </Badge>
                      {isCompleted && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {isFailed && <XCircle className="h-5 w-5 text-red-600" />}
                      {isInProgress && <Spinner size="sm" />}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Step details */}
                    <Collapsible
                      open={expandedStep === step.id}
                      onOpenChange={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full justify-between">
                          <span>View Details</span>
                          <ChevronRight className={cn(
                            "h-4 w-4 transition-transform",
                            expandedStep === step.id && "rotate-90"
                          )} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3 mt-3">
                        <div className="p-3 bg-muted rounded">
                          <p className="text-sm font-medium">Action:</p>
                          <p className="text-sm text-muted-foreground">{step.action}</p>
                        </div>

                        {step.prerequisites && step.prerequisites.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Prerequisites:</p>
                            <ul className="text-sm text-muted-foreground list-disc list-inside">
                              {step.prerequisites.map((prereq, prereqIndex) => (
                                <li key={prereqIndex}>{prereq}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {step.estimatedTime && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Estimated time: ~{step.estimatedTime} seconds
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Step actions */}
                    <div className="flex items-center gap-2">
                      {step.type === 'automatic' && (
                        <Button
                          size="sm"
                          onClick={() => executeStep(step)}
                          disabled={isInProgress || isCompleted}
                        >
                          {isInProgress ? (
                            <><Spinner size="sm" className="mr-1" /> Executing...</>
                          ) : isCompleted ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Completed</>
                          ) : (
                            <><Play className="h-3 w-3 mr-1" /> Execute Step</>
                          )}
                        </Button>
                      )}

                      {step.type === 'manual' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStepAction(step.id, 'manual_completed')}
                          disabled={isCompleted}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          I've Done This
                        </Button>
                      )}

                      {step.type === 'suggested' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStepAction(step.id, 'suggestion_applied')}
                          disabled={isCompleted}
                        >
                          <Lightbulb className="h-3 w-3 mr-1" />
                          Apply Suggestion
                        </Button>
                      )}
                    </div>

                    {/* Step result */}
                    {stepState?.result && (
                      <Alert>
                        <AlertDescription>
                          {stepState.result.message}
                        </AlertDescription>
                      </Alert>
                    )}

                    {stepState?.error && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          Error: {stepState.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recovery Strategy Overview</CardTitle>
              <CardDescription>
                Summary of the recovery plan for this error
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {strategy?.steps.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Steps</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {guidanceState.steps.filter(s => s.status === 'completed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {guidanceState.steps.filter(s => s.status === 'pending').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Remaining</div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Success Criteria</h4>
                <ul className="space-y-1">
                  {strategy?.successCriteria.map((criterion, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Target className="h-3 w-3 text-green-600" />
                      {criterion}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alternatives" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alternative Solutions</CardTitle>
              <CardDescription>
                Other approaches to resolve this error
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {strategy?.fallbackOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No alternative solutions available for this error type.
                  </p>
                ) : (
                  strategy?.fallbackOptions.map((fallback, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <h5 className="font-medium">{fallback.id}</h5>
                      <p className="text-sm text-muted-foreground mt-1">
                        {fallback.steps.length} alternative steps available
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Compact Recovery Guidance Card for inline use
 */
export function CompactRecoveryGuidance({
  error,
  strategy,
  onStart,
  className,
}: {
  error: ErrorInfo;
  strategy: RecoveryStrategy | null;
  onStart?: () => void;
  className?: string;
}) {
  if (!strategy) return null;

  return (
    <Card className={cn("border-l-4 border-blue-200 bg-blue-50", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-800">Recovery Guidance</h4>
              <p className="text-sm text-blue-600">
                {strategy.steps.length} steps to resolve this issue
              </p>
            </div>
          </div>
          <Button size="sm" onClick={onStart}>
            Start Recovery
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Recovery Progress Indicator
 */
export function RecoveryProgressIndicator({
  guidanceState,
  className,
}: {
  guidanceState: GuidanceState;
  className?: string;
}) {
  return (
    <Card className={cn("border-blue-200 bg-blue-50", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {guidanceState.isCompleted ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : guidanceState.isPlaying ? (
            <Spinner size="sm" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          )}
          <div className="flex-1">
            <h4 className="font-medium text-blue-800">
              {guidanceState.isCompleted
                ? "Recovery Completed"
                : guidanceState.isPlaying
                  ? "Recovery in Progress"
                  : "Recovery Ready"
              }
            </h4>
            <p className="text-sm text-blue-600">
              {guidanceState.steps.filter(s => s.status === 'completed').length} of {guidanceState.steps.length} steps completed
            </p>
          </div>
          <div className="text-sm text-blue-600 font-medium">
            {Math.round(guidanceState.totalProgress)}%
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default {
  ErrorRecoveryGuidance,
  CompactRecoveryGuidance,
  RecoveryProgressIndicator,
};
