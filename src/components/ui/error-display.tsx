/**
 * Intelligent Error Display Components for Parsify.dev
 * React components for displaying errors with recovery options
 */

import React, { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  ChevronDown,
  ChevronRight,
  Lightbulb,
  RefreshCw,
  Info,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Settings,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  EnhancedErrorInfo,
  RecoverySuggestion,
  RecoveryStep,
} from "@/lib/error-handling";

export interface ErrorDisplayProps {
  error: EnhancedErrorInfo;
  onRecovery?: (suggestion: RecoverySuggestion) => void;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  compact?: boolean;
  showDetails?: boolean;
  children?: React.ReactNode;
}

export interface RecoveryProgressProps {
  currentStep?: RecoveryStep;
  stepIndex?: number;
  totalSteps?: number;
  estimatedTime?: number;
  className?: string;
}

/**
 * Main Error Display Component
 */
export function ErrorDisplay({
  error,
  onRecovery,
  onRetry,
  onDismiss,
  className,
  compact = false,
  showDetails = false,
  children,
}: ErrorDisplayProps) {
  const [expandedDetails, setExpandedDetails] = useState(showDetails);
  const [activeTab, setActiveTab] = useState<
    "overview" | "suggestions" | "details"
  >("overview");
  const [isRecovering, setIsRecovering] = useState(false);

  const getSeverityIcon = (severity: EnhancedErrorInfo["severity"]) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
      case "debug":
        return <Settings className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: EnhancedErrorInfo["severity"]) => {
    switch (severity) {
      case "critical":
        return "border-red-200 bg-red-50";
      case "error":
        return "border-red-200 bg-red-50";
      case "warning":
        return "border-yellow-200 bg-yellow-50";
      case "info":
        return "border-blue-200 bg-blue-50";
      case "debug":
        return "border-gray-200 bg-gray-50";
    }
  };

  const handleRecovery = async (suggestion: RecoverySuggestion) => {
    if (onRecovery && suggestion.type === "automatic") {
      setIsRecovering(true);
      try {
        await onRecovery(suggestion);
      } finally {
        setIsRecovering(false);
      }
    } else if (onRecovery) {
      onRecovery(suggestion);
    }
  };

  if (compact) {
    return (
      <Alert className={cn(getSeverityColor(error.severity), className)}>
        {getSeverityIcon(error.severity)}
        <AlertTitle className="font-semibold">{error.userMessage}</AlertTitle>
        {error.recoverySuggestions.length > 0 && (
          <AlertDescription className="mt-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              <span className="text-sm">
                Suggestion: {error.recoverySuggestions[0].title}
              </span>
              {error.recoverySuggestions[0].type === "automatic" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRecovery(error.recoverySuggestions[0])}
                  disabled={isRecovering}
                >
                  {isRecovering ? (
                    <Spinner size="sm" className="mr-1" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  Try to Fix
                </Button>
              )}
            </div>
          </AlertDescription>
        )}
      </Alert>
    );
  }

  return (
    <Card
      className={cn("border-l-4", getSeverityColor(error.severity), className)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getSeverityIcon(error.severity)}
            <div className="flex-1">
              <CardTitle className="text-lg">{error.userMessage}</CardTitle>
              <CardDescription className="mt-1">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary" className="text-xs">
                    {error.type.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {error.category}
                  </Badge>
                  {error.toolId && (
                    <Badge variant="outline" className="text-xs">
                      {error.toolId}
                    </Badge>
                  )}
                </div>
              </CardDescription>
            </div>
          </div>
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="h-8 w-8 p-0"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error.recoverable && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">
              This error can be recovered automatically. See recovery options
              below.
            </span>
          </div>
        )}

        {children && <div className="py-2">{children}</div>}

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="suggestions">
              Solutions ({error.recoverySuggestions.length})
            </TabsTrigger>
            <TabsTrigger value="details">Technical Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3 mt-4">
            <div>
              <h4 className="font-medium mb-2">Quick Actions</h4>
              <div className="flex flex-wrap gap-2">
                {onRetry && (
                  <Button variant="outline" size="sm" onClick={onRetry}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry Operation
                  </Button>
                )}
                {error.recoverySuggestions.slice(0, 2).map((suggestion) => (
                  <Button
                    key={suggestion.id}
                    variant={
                      suggestion.type === "automatic" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleRecovery(suggestion)}
                    disabled={isRecovering}
                  >
                    {suggestion.type === "automatic" && isRecovering ? (
                      <Spinner size="sm" className="mr-1" />
                    ) : (
                      <Lightbulb className="h-3 w-3 mr-1" />
                    )}
                    {suggestion.title}
                  </Button>
                ))}
              </div>
            </div>

            {error.relatedTools && error.relatedTools.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Related Tools</h4>
                <div className="flex flex-wrap gap-1">
                  {error.relatedTools.map((tool) => (
                    <Badge key={tool} variant="outline" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-3 mt-4">
            {error.recoverySuggestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No specific recovery suggestions available for this error.
              </p>
            ) : (
              error.recoverySuggestions.map((suggestion) => (
                <RecoverySuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onExecute={() => handleRecovery(suggestion)}
                  isExecuting={isRecovering}
                />
              ))
            )}

            {error.alternativeSolutions &&
              error.alternativeSolutions.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Alternative Solutions</h4>
                  <ul className="space-y-1">
                    {error.alternativeSolutions.map((solution, index) => (
                      <li
                        key={index}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <ExternalLink className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        {solution}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </TabsContent>

          <TabsContent value="details" className="space-y-3 mt-4">
            <Collapsible
              open={expandedDetails}
              onOpenChange={setExpandedDetails}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between"
                >
                  <span>Error Details</span>
                  {expandedDetails ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3">
                <div className="grid gap-3 text-sm">
                  <div>
                    <span className="font-medium">Error Code:</span>
                    <code className="ml-2 px-2 py-1 bg-muted rounded">
                      {error.code}
                    </code>
                  </div>
                  <div>
                    <span className="font-medium">Error Type:</span>
                    <span className="ml-2">{error.type}</span>
                  </div>
                  <div>
                    <span className="font-medium">Severity:</span>
                    <Badge variant="outline" className="ml-2">
                      {error.severity}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Recoverable:</span>
                    <Badge
                      variant={error.recoverable ? "default" : "secondary"}
                      className="ml-2"
                    >
                      {error.recoverable ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Timestamp:</span>
                    <span className="ml-2">
                      {error.timestamp.toLocaleString()}
                    </span>
                  </div>
                  {error.technicalDetails && (
                    <div>
                      <span className="font-medium">Technical Details:</span>
                      <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(error.technicalDetails, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/**
 * Recovery Suggestion Card Component
 */
function RecoverySuggestionCard({
  suggestion,
  onExecute,
  isExecuting,
}: {
  suggestion: RecoverySuggestion;
  onExecute: () => void;
  isExecuting: boolean;
}) {
  const getTypeIcon = (type: RecoverySuggestion["type"]) => {
    switch (type) {
      case "automatic":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "manual":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "suggested":
        return <Lightbulb className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTypeColor = (type: RecoverySuggestion["type"]) => {
    switch (type) {
      case "automatic":
        return "border-green-200 bg-green-50";
      case "manual":
        return "border-yellow-200 bg-yellow-50";
      case "suggested":
        return "border-blue-200 bg-blue-50";
    }
  };

  const getDifficultyColor = (difficulty: RecoverySuggestion["difficulty"]) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
    }
  };

  return (
    <Card className={cn("border-l-2", getTypeColor(suggestion.type))}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {getTypeIcon(suggestion.type)}
            <div className="flex-1">
              <h4 className="font-medium">{suggestion.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {suggestion.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {suggestion.type}
                </Badge>
                <Badge
                  className={cn(
                    "text-xs",
                    getDifficultyColor(suggestion.difficulty),
                  )}
                >
                  {suggestion.difficulty}
                </Badge>
                {suggestion.successRate && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.successRate * 100}% success
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Success rate based on historical data</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {suggestion.estimatedTime && (
                  <Badge variant="outline" className="text-xs">
                    ~{suggestion.estimatedTime}s
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant={suggestion.type === "automatic" ? "default" : "outline"}
            onClick={onExecute}
            disabled={isExecuting || suggestion.type !== "automatic"}
          >
            {isExecuting && suggestion.type === "automatic" ? (
              <Spinner size="sm" className="mr-1" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            {suggestion.type === "automatic" ? "Execute" : "Follow Steps"}
          </Button>
        </div>

        {suggestion.action && (
          <div className="mt-3 p-3 bg-muted rounded">
            <p className="text-sm font-medium">Action:</p>
            <p className="text-sm text-muted-foreground">{suggestion.action}</p>
          </div>
        )}

        {suggestion.prerequisites && suggestion.prerequisites.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium">Prerequisites:</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside">
              {suggestion.prerequisites.map((prereq, index) => (
                <li key={index}>{prereq}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Recovery Progress Component
 */
export function RecoveryProgress({
  currentStep,
  stepIndex = 0,
  totalSteps = 0,
  estimatedTime,
  className,
}: RecoveryProgressProps) {
  if (!currentStep && totalSteps === 0) {
    return null;
  }

  return (
    <Card className={cn("border-blue-200 bg-blue-50", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Spinner size="sm" />
          <div className="flex-1">
            <h4 className="font-medium text-blue-800">
              {currentStep ? currentStep.title : "Recovering..."}
            </h4>
            <p className="text-sm text-blue-600">
              {currentStep
                ? currentStep.description
                : "Attempting to recover from error..."}
            </p>
            {totalSteps > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm text-blue-600">
                  <span>
                    Step {stepIndex + 1} of {totalSteps}
                  </span>
                  {estimatedTime && <span>~{estimatedTime}s remaining</span>}
                </div>
                <div className="w-full bg-blue-100 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${((stepIndex + 1) / totalSteps) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact Error Toast Component
 */
export function ErrorToast({
  error,
  onDismiss,
  onClick,
}: {
  error: EnhancedErrorInfo;
  onDismiss?: () => void;
  onClick?: () => void;
}) {
  const getSeverityColor = (severity: EnhancedErrorInfo["severity"]) => {
    switch (severity) {
      case "critical":
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      case "info":
        return "bg-blue-500";
      case "debug":
        return "bg-gray-500";
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg shadow-lg border cursor-pointer transition-all hover:shadow-xl",
        getSeverityColor(error.severity),
        onClick ? "opacity-90 hover:opacity-100" : "",
      )}
      onClick={onClick}
    >
      <div className="flex-1">
        <p className="text-white font-medium text-sm">{error.userMessage}</p>
        {error.recoverySuggestions.length > 0 && (
          <p className="text-white/80 text-xs mt-1">
            Suggestion: {error.recoverySuggestions[0].title}
          </p>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="text-white/80 hover:text-white p-1 rounded"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Error Context Provider for handling errors globally
 */
export interface ErrorContextType {
  errors: EnhancedErrorInfo[];
  addError: (error: EnhancedErrorInfo) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
  metrics: any;
}

export const ErrorContext = React.createContext<ErrorContextType | null>(null);

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [errors, setErrors] = useState<EnhancedErrorInfo[]>([]);

  const addError = (error: EnhancedErrorInfo) => {
    setErrors((prev) => [...prev, error]);
  };

  const removeError = (id: string) => {
    setErrors((prev) => prev.filter((error) => error.id !== id));
  };

  const clearErrors = () => {
    setErrors([]);
  };

  const value: ErrorContextType = {
    errors,
    addError,
    removeError,
    clearErrors,
    metrics: intelligentErrorHandler.getErrorMetrics(),
  };

  return (
    <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>
  );
}

/**
 * Hook for using error context
 */
export function useErrorContext() {
  const context = React.useContext(ErrorContext);
  if (!context) {
    throw new Error("useErrorContext must be used within an ErrorProvider");
  }
  return context;
}

/**
 * Error Boundary Component
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    fallback?: React.ComponentType<{
      error: Error;
      errorInfo: React.ErrorInfo;
    }>;
  },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log to error handling system
    const enhancedError = handleError(error, {
      category: "JSON Processing Suite", // Default category
      operation: "react-component-render",
      userContext: {
        componentStack: errorInfo.componentStack,
      },
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error!}
            errorInfo={this.state.errorInfo!}
          />
        );
      }

      const enhancedError = handleError(this.state.error!, {
        category: "JSON Processing Suite",
        operation: "react-component-render",
        userContext: {
          componentStack: this.state.errorInfo?.componentStack,
        },
      });

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <ErrorDisplay
            error={enhancedError}
            onRetry={() => {
              this.setState({ hasError: false, error: null, errorInfo: null });
            }}
            className="max-w-2xl w-full"
          />
        </div>
      );
    }

    return this.props.children;
  }
}
