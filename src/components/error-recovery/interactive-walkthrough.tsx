/**
 * Interactive Error Recovery Walkthrough Components
 * Provides step-by-step interactive guidance for error recovery
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import {
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
  Info,
  ExternalLink,
  Copy,
  BookOpen,
  Video,
  Code,
  Terminal,
  FileText,
  Settings,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  Upload,
  Download,
  Search,
  Filter,
  SortAsc,
  Edit3,
  Trash2,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ErrorInfo, RecoveryStep, RecoveryStrategy } from "@/lib/error-recovery";

export interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  type: 'instruction' | 'action' | 'verification' | 'input' | 'choice' | 'demo';
  content?: React.ReactNode;
  actions?: WalkthroughAction[];
  validation?: WalkthroughValidation;
  hints?: string[];
  resources?: WalkthroughResource[];
  estimatedTime?: number;
  optional?: boolean;
}

export interface WalkthroughAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  action: () => void | Promise<void>;
  icon?: React.ReactNode;
  disabled?: boolean;
  tooltip?: string;
}

export interface WalkthroughValidation {
  type: 'manual' | 'automatic' | 'conditional';
  condition?: () => boolean | Promise<boolean>;
  message?: string;
  successMessage?: string;
  failureMessage?: string;
}

export interface WalkthroughResource {
  type: 'link' | 'video' | 'documentation' | 'example' | 'tool';
  title: string;
  url?: string;
  content?: React.ReactNode;
  icon?: React.ReactNode;
}

export interface InteractiveWalkthroughProps {
  steps: WalkthroughStep[];
  onComplete?: (results: WalkthroughResult[]) => void;
  onStepChange?: (stepIndex: number, step: WalkthroughStep) => void;
  onSkip?: (stepIndex: number, step: WalkthroughStep) => void;
  className?: string;
  showProgress?: boolean;
  allowSkip?: boolean;
  autoAdvance?: boolean;
  compact?: boolean;
}

export interface WalkthroughResult {
  stepId: string;
  completed: boolean;
  skipped: boolean;
  duration: number;
  userInput?: any;
  validationPassed?: boolean;
  notes?: string;
}

export interface WalkthroughState {
  currentStepIndex: number;
  stepResults: WalkthroughResult[];
  isPlaying: boolean;
  isCompleted: boolean;
  startTime?: Date;
  stepStartTime?: Date;
  totalDuration: number;
}

/**
 * Main Interactive Walkthrough Component
 */
export function InteractiveWalkthrough({
  steps,
  onComplete,
  onStepChange,
  onSkip,
  className,
  showProgress = true,
  allowSkip = true,
  autoAdvance = false,
  compact = false,
}: InteractiveWalkthroughProps) {
  const [state, setState] = useState<WalkthroughState>({
    currentStepIndex: 0,
    stepResults: [],
    isPlaying: false,
    isCompleted: false,
    totalDuration: 0,
  });

  const [userInput, setUserInput] = useState<any>({});
  const [validationResults, setValidationResults] = useState<Record<string, boolean>>({});
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [expandedResources, setExpandedResources] = useState<Record<string, boolean>>({});

  const currentStep = steps[state.currentStepIndex];
  const currentStepResult = state.stepResults.find(r => r.stepId === currentStep?.id);

  // Initialize step results
  useEffect(() => {
    const initialResults = steps.map(step => ({
      stepId: step.id,
      completed: false,
      skipped: false,
      duration: 0,
    }));
    setState(prev => ({ ...prev, stepResults: initialResults }));
  }, [steps]);

  // Handle step completion
  const completeStep = useCallback(async (skipped = false) => {
    if (!currentStep) return;

    const endTime = new Date();
    const duration = state.stepStartTime
      ? endTime.getTime() - state.stepStartTime.getTime()
      : 0;

    const result: WalkthroughResult = {
      stepId: currentStep.id,
      completed: !skipped,
      skipped,
      duration,
      userInput: userInput[currentStep.id],
      validationPassed: validationResults[currentStep.id],
    };

    setState(prev => {
      const newResults = prev.stepResults.map(r =>
        r.stepId === currentStep.id ? result : r
      );

      const nextIndex = prev.currentStepIndex + 1;
      const isCompleted = nextIndex >= steps.length;

      if (isCompleted) {
        onComplete?.(newResults);
      }

      return {
        ...prev,
        currentStepIndex: isCompleted ? prev.currentStepIndex : nextIndex,
        stepResults: newResults,
        isCompleted,
        stepStartTime: isCompleted ? undefined : new Date(),
      };
    });

    onStepChange?.(state.currentStepIndex, currentStep);
  }, [currentStep, state.stepStartTime, userInput, validationResults, steps, onComplete, onStepChange]);

  // Handle step validation
  const validateStep = useCallback(async () => {
    if (!currentStep?.validation) return;

    const { validation } = currentStep;
    let passed = false;

    try {
      switch (validation.type) {
        case 'manual':
          passed = true; // User confirms manually
          break;
        case 'automatic':
          if (validation.condition) {
            passed = await validation.condition();
          }
          break;
        case 'conditional':
          if (validation.condition) {
            passed = await validation.condition();
          }
          break;
      }
    } catch (error) {
      console.error('Validation error:', error);
      passed = false;
    }

    setValidationResults(prev => ({
      ...prev,
      [currentStep.id]: passed,
    }));

    return passed;
  }, [currentStep]);

  // Execute walkthrough action
  const executeAction = useCallback(async (action: WalkthroughAction) => {
    try {
      await action.action();

      // Auto-advance if enabled and it's a primary action
      if (autoAdvance && action.type === 'primary') {
        setTimeout(() => {
          completeStep();
        }, 500);
      }
    } catch (error) {
      console.error('Action execution error:', error);
    }
  }, [autoAdvance, completeStep]);

  // Navigate to specific step
  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setState(prev => ({
        ...prev,
        currentStepIndex: stepIndex,
        stepStartTime: new Date(),
      }));
      onStepChange?.(stepIndex, steps[stepIndex]);
    }
  }, [steps, onStepChange]);

  // Skip current step
  const skipStep = useCallback(() => {
    if (allowSkip && currentStep) {
      onSkip?.(state.currentStepIndex, currentStep);
      completeStep(true);
    }
  }, [allowSkip, currentStep, state.currentStepIndex, onSkip, completeStep]);

  // Reset walkthrough
  const resetWalkthrough = useCallback(() => {
    setState({
      currentStepIndex: 0,
      stepResults: steps.map(step => ({
        stepId: step.id,
        completed: false,
        skipped: false,
        duration: 0,
      })),
      isPlaying: false,
      isCompleted: false,
      totalDuration: 0,
      stepStartTime: new Date(),
    });
    setUserInput({});
    setValidationResults({});
    setShowHints({});
  }, [steps]);

  // Calculate progress
  const completedSteps = state.stepResults.filter(r => r.completed || r.skipped).length;
  const progressPercentage = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

  if (compact) {
    return (
      <Card className={cn("border-blue-200 bg-blue-50", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Play className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-800">Interactive Walkthrough</h4>
                <p className="text-sm text-blue-600">
                  {steps.length} steps • {completedSteps} completed
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => goToStep(0)}>
              Start
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Progress Header */}
      {showProgress && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Error Recovery Walkthrough</CardTitle>
                <CardDescription>
                  Step {state.currentStepIndex + 1} of {steps.length}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {Math.round(progressPercentage)}% Complete
                </Badge>
                <Button size="sm" variant="outline" onClick={resetWalkthrough}>
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex items-center justify-between mt-2">
              <div className="text-sm text-muted-foreground">
                {completedSteps} of {steps.length} steps completed
              </div>
              <div className="text-sm text-muted-foreground">
                {Math.round(state.totalDuration / 1000)}s elapsed
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Step */}
      {currentStep && (
        <Card className={cn(
          "transition-all duration-300",
          currentStepResult?.completed && "border-green-200 bg-green-50",
          currentStepResult?.skipped && "border-yellow-200 bg-yellow-50"
        )}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {state.currentStepIndex + 1}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">{currentStep.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {currentStep.description}
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{currentStep.type}</Badge>
                    {currentStep.optional && (
                      <Badge variant="secondary">Optional</Badge>
                    )}
                    {currentStep.estimatedTime && (
                      <Badge variant="outline">
                        ~{currentStep.estimatedTime}s
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {currentStepResult?.completed && (
                <CheckCircle className="h-6 w-6 text-green-600" />
              )}
              {currentStepResult?.skipped && (
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step Content */}
            {currentStep.content && (
              <div className="p-4 bg-muted rounded-lg">
                {currentStep.content}
              </div>
            )}

            {/* Dynamic Step Content based on type */}
            <StepContentRenderer
              step={currentStep}
              userInput={userInput}
              setUserInput={setUserInput}
              validationResults={validationResults}
              setValidationResults={setValidationResults}
            />

            {/* Hints */}
            {currentStep.hints && currentStep.hints.length > 0 && (
              <CollapsibleSection
                title="Hints"
                icon={Lightbulb}
                expanded={showHints[currentStep.id]}
                onToggle={() => setShowHints(prev => ({
                  ...prev,
                  [currentStep.id]: !prev[currentStep.id]
                }))}
              >
                <div className="space-y-2">
                  {currentStep.hints.map((hint, index) => (
                    <Alert key={index}>
                      <Lightbulb className="h-4 w-4" />
                      <AlertDescription>{hint}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Resources */}
            {currentStep.resources && currentStep.resources.length > 0 && (
              <CollapsibleSection
                title="Resources"
                icon={BookOpen}
                expanded={expandedResources[currentStep.id]}
                onToggle={() => setExpandedResources(prev => ({
                  ...prev,
                  [currentStep.id]: !prev[currentStep.id]
                }))}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentStep.resources.map((resource, index) => (
                    <ResourceCard key={index} resource={resource} />
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex gap-2">
                {state.currentStepIndex > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => goToStep(state.currentStepIndex - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                )}
                {allowSkip && !currentStepResult?.completed && (
                  <Button
                    variant="secondary"
                    onClick={skipStep}
                  >
                    Skip Step
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {currentStep.actions?.map((action) => (
                  <TooltipProvider key={action.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={action.type === 'primary' ? 'default' : 'outline'}
                          onClick={() => executeAction(action)}
                          disabled={action.disabled}
                        >
                          {action.icon}
                          {action.label}
                        </Button>
                      </TooltipTrigger>
                      {action.tooltip && (
                        <TooltipContent>
                          <p>{action.tooltip}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                ))}

                {!currentStep.actions || currentStep.actions.length === 0 ? (
                  <Button
                    onClick={() => completeStep()}
                    disabled={currentStepResult?.completed}
                  >
                    {currentStepResult?.completed ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Completed
                      </>
                    ) : (
                      <>
                        Complete Step
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Navigate to any step:
            </div>
            <div className="flex gap-1">
              {steps.map((_, index) => {
                const result = state.stepResults[index];
                return (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant={index === state.currentStepIndex ? "default" : "outline"}
                          className={cn(
                            "w-8 h-8 p-0",
                            result?.completed && "bg-green-100 border-green-300",
                            result?.skipped && "bg-yellow-100 border-yellow-300"
                          )}
                          onClick={() => goToStep(index)}
                        >
                          {index + 1}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Step {index + 1}: {steps[index].title}</p>
                        {result?.completed && <p className="text-green-600">Completed</p>}
                        {result?.skipped && <p className="text-yellow-600">Skipped</p>}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Step Content Renderer
 */
function StepContentRenderer({
  step,
  userInput,
  setUserInput,
  validationResults,
  setValidationResults,
}: {
  step: WalkthroughStep;
  userInput: any;
  setUserInput: (input: any) => void;
  validationResults: Record<string, boolean>;
  setValidationResults: (results: any) => void;
}) {
  const [localValue, setLocalValue] = useState('');

  switch (step.type) {
    case 'input':
      return (
        <div className="space-y-3">
          <Label htmlFor={`input-${step.id}`}>Please enter the required information:</Label>
          {step.content?.toString().includes('multiline') ? (
            <Textarea
              id={`input-${step.id}`}
              placeholder="Enter your response here..."
              value={userInput[step.id] || ''}
              onChange={(e) => setUserInput({
                ...userInput,
                [step.id]: e.target.value
              })}
            />
          ) : (
            <Input
              id={`input-${step.id}`}
              placeholder="Enter your response here..."
              value={userInput[step.id] || ''}
              onChange={(e) => setUserInput({
                ...userInput,
                [step.id]: e.target.value
              })}
            />
          )}
        </div>
      );

    case 'choice':
      return (
        <div className="space-y-3">
          <Label>Please select an option:</Label>
          <RadioGroup
            value={userInput[step.id] || ''}
            onValueChange={(value) => setUserInput({
              ...userInput,
              [step.id]: value
            })}
          >
            {step.content && Array.isArray(step.content) && step.content.map((option: any, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );

    case 'verification':
      return (
        <div className="space-y-3">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Please verify that you have completed the required action.
            </AlertDescription>
          </Alert>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`verify-${step.id}`}
              checked={userInput[step.id] || false}
              onCheckedChange={(checked) => setUserInput({
                ...userInput,
                [step.id]: checked
              })}
            />
            <Label htmlFor={`verify-${step.id}`}>
              I have completed this step
            </Label>
          </div>
        </div>
      );

    case 'demo':
      return (
        <div className="space-y-3">
          <Alert>
            <Video className="h-4 w-4" />
            <AlertDescription>
              This is a demonstration step. Follow along with the example below.
            </AlertDescription>
          </Alert>
          {step.content && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              {step.content}
            </div>
          )}
        </div>
      );

    case 'action':
      return (
        <div className="space-y-3">
          <Alert>
            <Play className="h-4 w-4" />
            <AlertDescription>
              This step requires you to perform an action.
            </AlertDescription>
          </Alert>
          {step.content && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              {step.content}
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}

/**
 * Collapsible Section Component
 */
function CollapsibleSection({
  title,
  icon,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(expanded);

  useEffect(() => {
    setIsOpen(expanded);
  }, [expanded]);

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setIsOpen(!isOpen);
          onToggle();
        }}
        className="w-full justify-between"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </div>
        {isOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
      {isOpen && children}
    </div>
  );
}

/**
 * Resource Card Component
 */
function ResourceCard({ resource }: { resource: WalkthroughResource }) {
  const getIcon = () => {
    switch (resource.type) {
      case 'link':
        return <ExternalLink className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'documentation':
        return <BookOpen className="h-4 w-4" />;
      case 'example':
        return <Code className="h-4 w-4" />;
      case 'tool':
        return <Settings className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  if (resource.url) {
    return (
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-3 border rounded-lg hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-2">
          {resource.icon || getIcon()}
          <span className="text-sm font-medium">{resource.title}</span>
          <ExternalLink className="h-3 w-3 ml-auto" />
        </div>
      </a>
    );
  }

  return (
    <div className="p-3 border rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        {resource.icon || getIcon()}
        <span className="text-sm font-medium">{resource.title}</span>
      </div>
      {resource.content && (
        <div className="text-sm text-muted-foreground">
          {resource.content}
        </div>
      )}
    </div>
  );
}

/**
 * Specialized Walkthrough for JSON Errors
 */
export function JSONErrorWalkthrough({
  error,
  onComplete,
  className,
}: {
  error: ErrorInfo;
  onComplete?: (results: WalkthroughResult[]) => void;
  className?: string;
}) {
  const steps: WalkthroughStep[] = [
    {
      id: 'identify-error',
      title: 'Identify the JSON Error',
      description: 'Let\'s identify what type of JSON error we\'re dealing with',
      type: 'instruction',
      content: (
        <div className="space-y-2">
          <p><strong>Common JSON errors include:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Syntax errors (missing commas, brackets)</li>
            <li>Invalid escape sequences</li>
            <li>Unmatched quotes</li>
            <li>Trailing commas</li>
          </ul>
        </div>
      ),
      hints: [
        'Look at the error message - it usually tells you the line number',
        'JSON syntax is very strict - even small mistakes cause errors',
        'Use a JSON validator to pinpoint exact issues'
      ],
      estimatedTime: 30,
    },
    {
      id: 'validate-syntax',
      title: 'Validate JSON Syntax',
      description: 'Check if your JSON is syntactically correct',
      type: 'verification',
      content: (
        <div className="space-y-3">
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertDescription>
              Copy your JSON and paste it into the JSON Validator tool to check for syntax errors.
            </AlertDescription>
          </Alert>
          <div className="p-3 bg-muted rounded">
            <p className="text-sm font-medium mb-2">Quick syntax check:</p>
            <code className="text-xs">
              {JSON.stringify({ sample: "JSON", structure: "for", testing: true }, null, 2)}
            </code>
          </div>
        </div>
      ),
      actions: [
        {
          id: 'open-validator',
          label: 'Open JSON Validator',
          type: 'primary',
          icon: <ExternalLink className="h-4 w-4 mr-1" />,
          action: () => {
            window.open('/tools/json/validator', '_blank');
          },
          tooltip: 'Open JSON Validator in new tab',
        },
      ],
      estimatedTime: 60,
    },
    {
      id: 'format-json',
      title: 'Format the JSON',
      description: 'Properly format your JSON to make it more readable',
      type: 'action',
      content: (
        <div className="space-y-3">
          <p>Use the JSON Formatter to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Add proper indentation</li>
            <li>Sort keys alphabetically (optional)</li>
            <li>Remove unnecessary whitespace</li>
            <li>Make the structure more visible</li>
          </ul>
        </div>
      ),
      actions: [
        {
          id: 'open-formatter',
          label: 'Open JSON Formatter',
          type: 'primary',
          icon: <ExternalLink className="h-4 w-4 mr-1" />,
          action: () => {
            window.open('/tools/json/formatter', '_blank');
          },
        },
      ],
      hints: [
        'Proper formatting makes it easier to spot syntax errors',
        'Consider sorting keys for better organization',
        'Save the formatted version for future use'
      ],
      estimatedTime: 45,
    },
    {
      id: 'verify-fix',
      title: 'Verify the Fix',
      description: 'Confirm that your JSON is now working correctly',
      type: 'verification',
      content: (
        <div className="space-y-3">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Test your JSON to make sure it parses correctly now.
            </AlertDescription>
          </Alert>
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm font-medium text-green-800">
              Success criteria:
            </p>
            <ul className="text-sm text-green-700 list-disc list-inside mt-1">
              <li>JSON parses without errors</li>
              <li>All data is intact and accessible</li>
              <li>No syntax errors reported</li>
            </ul>
          </div>
        </div>
      ),
      estimatedTime: 30,
    },
  ];

  return (
    <InteractiveWalkthrough
      steps={steps}
      onComplete={onComplete}
      className={className}
      showProgress={true}
      allowSkip={true}
    />
  );
}

export default {
  InteractiveWalkthrough,
  JSONErrorWalkthrough,
};
