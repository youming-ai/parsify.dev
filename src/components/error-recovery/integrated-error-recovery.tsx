/**
 * Integrated Error Recovery System
 * Combines all error recovery components into a comprehensive solution
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Lightbulb,
  Settings,
  BookOpen,
  Video,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  HelpCircle,
  Activity,
  Target,
  Zap,
  Shield,
  Terminal,
  Globe,
  Database,
  FileText,
  Type,
  Code,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ErrorInfo, RecoveryStrategy, ErrorRecoveryResult } from "@/lib/error-recovery";
import type { RecoveryProgress } from "./progress-tracker";
import type { CategoryGuidanceTemplate } from "./category-guidance";

// Import our components
import { ErrorDisplay } from "@/components/ui/error-display";
import { ErrorRecoveryGuidance } from "./error-recovery-guidance";
import { InteractiveWalkthrough, JSONErrorWalkthrough } from "./interactive-walkthrough";
import { CategoryGuidance, categoryGuidanceTemplates } from "./category-guidance";
import { ProgressTracker } from "./progress-tracker";
import {
  VisualFeedback,
  AnimatedIcon,
  ProgressAnimation,
  StepIndicator,
  SuccessCelebration,
  InteractiveTutorial,
} from "./visual-feedback";

// Import hooks
import { useErrorRecovery } from "@/hooks/useErrorRecovery";

export interface IntegratedErrorRecoveryProps {
  error: ErrorInfo;
  strategy: RecoveryStrategy | null;
  category?: string;
  toolId?: string;
  onRecoveryComplete?: (result: ErrorRecoveryResult) => void;
  onDismiss?: () => void;
  onError?: (error: ErrorInfo) => void;
  mode?: 'modal' | 'inline' | 'sheet' | 'toast';
  compact?: boolean;
  showAdvanced?: boolean;
  autoStart?: boolean;
  enableTutorial?: boolean;
  className?: string;
}

export interface ErrorRecoveryState {
  isActive: boolean;
  currentView: 'overview' | 'guidance' | 'walkthrough' | 'category-help' | 'progress' | 'settings';
  progress: RecoveryProgress | null;
  isRecovering: boolean;
  recoveryResult: ErrorRecoveryResult | null;
  showSuccess: boolean;
  tutorialCompleted: boolean;
  userPreferences: {
    autoRecovery: boolean;
    showProgress: boolean;
    enableAnimations: boolean;
    preferredView: string;
  };
}

/**
 * Main Integrated Error Recovery Component
 */
export function IntegratedErrorRecovery({
  error,
  strategy,
  category,
  toolId,
  onRecoveryComplete,
  onDismiss,
  onError,
  mode = 'inline',
  compact = false,
  showAdvanced = false,
  autoStart = false,
  enableTutorial = true,
  className,
}: IntegratedErrorRecoveryProps) {
  const [state, setState] = useState<ErrorRecoveryState>({
    isActive: true,
    currentView: 'overview',
    progress: null,
    isRecovering: false,
    recoveryResult: null,
    showSuccess: false,
    tutorialCompleted: false,
    userPreferences: {
      autoRecovery: false,
      showProgress: true,
      enableAnimations: true,
      preferredView: 'overview',
    },
  });

  const [showTutorial, setShowTutorial] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Use existing error recovery hook
  const {
    handleError,
    attemptRecovery,
    retry,
    reset,
    userError,
    formattedError,
    isRecoverable,
    recoveryProgress,
  } = useErrorRecovery({
    toolId: toolId || 'unknown',
    operation: 'error-recovery',
    autoRecovery: state.userPreferences.autoRecovery,
    onError: (errorInfo) => {
      onError?.(errorInfo);
    },
    onRecovery: (result) => {
      handleRecoveryComplete(result);
    },
  });

  // Initialize recovery process
  useEffect(() => {
    if (autoStart && isRecoverable && strategy) {
      setTimeout(() => {
        startRecovery();
      }, 1000);
    }
  }, [autoStart, isRecoverable, strategy]);

  // Show tutorial on first error if enabled
  useEffect(() => {
    if (enableTutorial && !state.tutorialCompleted && !showTutorial && isRecoverable) {
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [enableTutorial, state.tutorialCompleted, showTutorial, isRecoverable]);

  const startRecovery = useCallback(async () => {
    if (!strategy || !isRecoverable) return;

    setState(prev => ({
      ...prev,
      isRecovering: true,
      currentView: 'guidance',
    }));

    try {
      // Initialize progress tracking
      const progress: RecoveryProgress = {
        sessionId: `recovery-${Date.now()}`,
        errorId: error.id || 'unknown',
        strategy,
        steps: strategy.steps.map(step => ({
          id: step.id,
          title: step.title,
          status: 'pending',
          startTime: undefined,
          endTime: undefined,
          duration: undefined,
          metadata: {
            difficulty: step.priority > 2 ? 'hard' : step.priority > 1 ? 'medium' : 'easy',
            estimatedTime: step.estimatedTime,
          },
        })),
        overallStatus: 'in_progress',
        startTime: new Date(),
        metrics: {
          totalSteps: strategy.steps.length,
          completedSteps: 0,
          failedSteps: 0,
          skippedSteps: 0,
          inProgressSteps: 0,
          averageStepTime: 0,
          estimatedTimeRemaining: strategy.steps.reduce((sum, step) => sum + (step.estimatedTime || 30), 0),
          successRate: 0,
          retryRate: 0,
          efficiency: 0,
          progressPercentage: 0,
        },
        metadata: {
          toolId,
          category,
          userAgent: navigator.userAgent,
        },
      };

      setState(prev => ({
        ...prev,
        progress,
      }));

      // Start the recovery using the hook
      await attemptRecovery();
    } catch (recoveryError) {
      setState(prev => ({
        ...prev,
        isRecovering: false,
        currentView: 'overview',
      }));
      handleError(recoveryError as Error);
    }
  }, [strategy, isRecoverable, error, attemptRecovery, handleError, toolId, category]);

  const handleRecoveryComplete = useCallback((result: ErrorRecoveryResult) => {
    setState(prev => ({
      ...prev,
      isRecovering: false,
      recoveryResult: result,
      showSuccess: result.success,
      currentView: result.success ? 'overview' : 'guidance',
      progress: prev.progress ? {
        ...prev.progress,
        overallStatus: result.success ? 'completed' : 'failed',
        endTime: new Date(),
        metrics: {
          ...prev.progress.metrics,
          progressPercentage: result.success ? 100 : prev.progress.metrics.progressPercentage,
          successRate: result.success ? 100 : prev.progress.metrics.successRate,
        },
      } : null,
    }));

    onRecoveryComplete?.(result);
  }, [onRecoveryComplete]);

  const resetRecovery = useCallback(() => {
    reset();
    setState({
      isActive: true,
      currentView: 'overview',
      progress: null,
      isRecovering: false,
      recoveryResult: null,
      showSuccess: false,
      tutorialCompleted: false,
      userPreferences: state.userPreferences,
    });
  }, [reset, state.userPreferences]);

  const getCategoryInfo = useMemo(() => {
    if (!category) return null;
    return categoryGuidanceTemplates[category];
  }, [category]);

  const getCurrentViewIcon = () => {
    switch (state.currentView) {
      case 'overview': return <Activity className="h-4 w-4" />;
      case 'guidance': return <Target className="h-4 w-4" />;
      case 'walkthrough': return <Play className="h-4 w-4" />;
      case 'category-help': return <BookOpen className="h-4 w-4" />;
      case 'progress': return <Activity className="h-4 w-4" />;
      case 'settings': return <Settings className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = () => {
    switch (category) {
      case 'JSON Processing': return <FileText className="h-4 w-4" />;
      case 'Code Execution': return <Terminal className="h-4 w-4" />;
      case 'File Processing': return <Database className="h-4 w-4" />;
      case 'Network Tools': return <Globe className="h-4 w-4" />;
      case 'Text Processing': return <Type className="h-4 w-4" />;
      case 'Security Tools': return <Shield className="h-4 w-4" />;
      default: return <Code className="h-4 w-4" />;
    }
  };

  const renderContent = () => {
    if (state.showSuccess && state.recoveryResult?.success) {
      return (
        <SuccessCelebration
          title="Error Resolved Successfully!"
          description="The error has been recovered and you can continue using the tool."
          onComplete={() => {
            setState(prev => ({ ...prev, showSuccess: false }));
            onDismiss?.();
          }}
        />
      );
    }

    if (state.currentView === 'overview') {
      return (
        <div className="space-y-6">
          {/* Error Summary */}
          <ErrorDisplay
            error={error}
            onRecovery={startRecovery}
            onRetry={retry}
            onDismiss={onDismiss}
            compact={compact}
          />

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Fast solutions to get you back on track
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {strategy && isRecoverable && (
                  <Button
                    onClick={startRecovery}
                    disabled={state.isRecovering}
                    className="w-full"
                  >
                    {state.isRecovering ? (
                      <>
                        <Activity className="h-4 w-4 mr-2 animate-spin" />
                        Recovering...
                      </>
                    ) : (
                      <>
                        <Target className="h-4 w-4 mr-2" />
                        Start Recovery
                      </>
                    )}
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => setState(prev => ({ ...prev, currentView: 'walkthrough' }))}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Interactive Guide
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setState(prev => ({ ...prev, currentView: 'category-help' }))}
                  className="w-full"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Category Help
                </Button>

                {getCategoryInfo() && (
                  <Button
                    variant="outline"
                    onClick={() => setShowTutorial(true)}
                    className="w-full"
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Take Tutorial
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress Overview */}
          {state.progress && state.userPreferences.showProgress && (
            <ProgressTracker
              progress={state.progress}
              compact={true}
              realTimeUpdates={true}
            />
          )}

          {/* Category Specific Guidance */}
          {getCategoryInfo() && !compact && (
            <CategoryGuidance
              category={category!}
              error={error}
              compact={false}
              onQuickFixSelect={(fix) => {
                // Apply quick fix
                console.log('Applying quick fix:', fix);
              }}
              onWalkthroughStart={(walkthrough) => {
                console.log('Starting walkthrough:', walkthrough);
              }}
            />
          )}
        </div>
      );
    }

    if (state.currentView === 'guidance' && strategy) {
      return (
        <ErrorRecoveryGuidance
          error={error}
          strategy={strategy}
          onStepComplete={(step, result) => {
            console.log('Step completed:', step, result);
          }}
          onRecoveryComplete={handleRecoveryComplete}
          onDismiss={() => setState(prev => ({ ...prev, currentView: 'overview' }))}
          autoStart={false}
          compact={compact}
        />
      );
    }

    if (state.currentView === 'walkthrough') {
      if (category === 'JSON Processing') {
        return (
          <JSONErrorWalkthrough
            error={error}
            onComplete={(results) => {
              console.log('Walkthrough completed:', results);
              setState(prev => ({ ...prev, currentView: 'overview' }));
            }}
          />
        );
      }

      return (
        <InteractiveWalkthrough
          steps={
            strategy?.steps.map(step => ({
              id: step.id,
              title: step.title,
              description: step.description,
              type: step.type === 'automatic' ? 'action' : 'instruction',
              content: step.action,
              estimatedTime: step.estimatedTime,
              optional: step.priority < 2,
            })) || []
          }
          onComplete={(results) => {
            console.log('Walkthrough completed:', results);
            setState(prev => ({ ...prev, currentView: 'overview' }));
          }}
          showProgress={true}
          allowSkip={true}
        />
      );
    }

    if (state.currentView === 'category-help' && getCategoryInfo) {
      return (
        <CategoryGuidance
          category={category!}
          error={error}
          onQuickFixSelect={(fix) => {
            console.log('Applying quick fix:', fix);
          }}
          onWalkthroughStart={(walkthrough) => {
            console.log('Starting walkthrough:', walkthrough);
          }}
        />
      );
    }

    if (state.currentView === 'progress' && state.progress) {
      return (
        <ProgressTracker
          progress={state.progress}
          onStepRetry={(stepId) => {
            console.log('Retrying step:', stepId);
          }}
          onStepSkip={(stepId) => {
            console.log('Skipping step:', stepId);
          }}
          onPause={() => {
            setState(prev => ({
              ...prev,
              progress: prev.progress ? {
                ...prev.progress,
                overallStatus: 'paused',
              } : null,
            }));
          }}
          onResume={() => {
            setState(prev => ({
              ...prev,
              progress: prev.progress ? {
                ...prev.progress,
                overallStatus: 'in_progress',
              } : null,
            }));
          }}
          onReset={resetRecovery}
          showDetails={true}
          showMetrics={true}
        />
      );
    }

    return null;
  };

  const content = renderContent();

  if (mode === 'modal') {
    return (
      <Dialog open={state.isActive} onOpenChange={(open) => !open && onDismiss?.()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getCategoryIcon && <getCategoryIcon />}
              Error Recovery Assistant
            </DialogTitle>
            <DialogDescription>
              {category && `${category} • `}
              {error.type} error in {toolId}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={state.currentView} onValueChange={(value) => setState(prev => ({ ...prev, currentView: value as any }))}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="guidance" disabled={!strategy}>Guidance</TabsTrigger>
              <TabsTrigger value="walkthrough">Walkthrough</TabsTrigger>
              <TabsTrigger value="category-help" disabled={!getCategoryInfo}>Help</TabsTrigger>
              <TabsTrigger value="progress" disabled={!state.progress}>Progress</TabsTrigger>
              {showAdvanced && (
                <TabsTrigger value="settings">Settings</TabsTrigger>
              )}
            </TabsList>

            <div className="mt-6">
              {content}
            </div>
          </Tabs>

          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {state.progress && (
                  <Badge variant="outline">
                    {state.progress.metrics.progressPercentage.toFixed(1)}% Complete
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetRecovery}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
                <Button variant="outline" onClick={onDismiss}>
                  Close
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (mode === 'sheet') {
    return (
      <Sheet open={state.isActive} onOpenChange={(open) => !open && onDismiss?.()}>
        <SheetContent className="w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {getCategoryIcon && <getCategoryIcon />}
              Error Recovery
            </SheetTitle>
            <SheetDescription>
              {category && `${category} • `}
              {error.type} error
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {content}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (mode === 'toast') {
    return (
      <div className={cn("fixed bottom-4 right-4 z-50 max-w-sm", className)}>
        <Card className="border-l-4 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {state.isRecovering ? (
                <Activity className="h-5 w-5 text-blue-600 animate-spin" />
              ) : state.showSuccess ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
              <div className="flex-1">
                <h4 className="font-medium text-sm">
                  {state.showSuccess ? 'Error Resolved' : 'Error Detected'}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {error.message}
                </p>
              </div>
              <div className="flex gap-1">
                {!state.showSuccess && isRecoverable && (
                  <Button size="sm" onClick={startRecovery} disabled={state.isRecovering}>
                    {state.isRecovering ? '...' : 'Fix'}
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={onDismiss}>
                  <XCircle className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default inline mode
  return (
    <div className={cn("w-full", className)}>
      {content}
    </div>
  );
}

/**
 * Error Recovery Provider Component
 * Wraps the application with error recovery capabilities
 */
export function ErrorRecoveryProvider({
  children,
  defaultMode = 'inline',
  enableTutorial = true,
}: {
  children: React.ReactNode;
  defaultMode?: 'modal' | 'inline' | 'sheet' | 'toast';
  enableTutorial?: boolean;
}) {
  const [currentError, setCurrentError] = useState<ErrorInfo | null>(null);
  const [errorStrategy, setErrorStrategy] = useState<RecoveryStrategy | null>(null);

  const handleError = useCallback((error: Error | ErrorInfo, strategy?: RecoveryStrategy) => {
    const errorInfo = 'type' in error ? error : {
      type: 'processing',
      severity: 'error',
      code: 'UNKNOWN',
      message: error.message,
      timestamp: new Date(),
      recoverable: true,
    } as ErrorInfo;

    setCurrentError(errorInfo);
    setErrorStrategy(strategy || null);
  }, []);

  const clearError = useCallback(() => {
    setCurrentError(null);
    setErrorStrategy(null);
  }, []);

  return (
    <>
      {children}

      {currentError && (
        <IntegratedErrorRecovery
          error={currentError}
          strategy={errorStrategy}
          mode={defaultMode}
          enableTutorial={enableTutorial}
          onDismiss={clearError}
        />
      )}
    </>
  );
}

export default {
  IntegratedErrorRecovery,
  ErrorRecoveryProvider,
};
