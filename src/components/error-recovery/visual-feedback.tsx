/**
 * Visual Feedback and Animations for Error Recovery
 * Provides engaging visual elements to guide users through the recovery process
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Info,
  Lightbulb,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Zap,
  Target,
  Activity,
  Sparkles,
  Loader2,
  RefreshCw,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  Expand,
  Minimize,
  Eye,
  EyeOff,
  Settings,
  HelpCircle,
  Trophy,
  Star,
  Flame,
  Rocket,
  Magnet,
  Compass,
  Map,
  Flag,
  CheckSquare,
  Square,
  TrendingUp,
  BarChart3,
  PieChart,
  Timer,
  Clock,
  Hourglass,
  Gauge,
  Speed,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ErrorInfo, RecoveryStep, RecoveryStrategy } from "@/lib/error-recovery";

export interface VisualFeedbackProps {
  type: 'success' | 'error' | 'warning' | 'info' | 'loading' | 'progress';
  title: string;
  description?: string;
  progress?: number;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface AnimatedIconProps {
  icon: React.ReactNode;
  type: 'pulse' | 'bounce' | 'spin' | 'shake' | 'heartbeat' | 'glow' | 'float';
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export interface ProgressAnimationProps {
  value: number;
  maxValue?: number;
  type: 'circular' | 'linear' | 'wave' | 'particles' | 'confetti';
  animated?: boolean;
  showValue?: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface StepIndicatorProps {
  steps: RecoveryStep[];
  currentIndex: number;
  completed: number[];
  animated?: boolean;
  interactive?: boolean;
  onStepClick?: (index: number) => void;
  className?: string;
}

export interface GuidedAnimationProps {
  steps: GuidedAnimationStep[];
  onComplete?: () => void;
  autoPlay?: boolean;
  loop?: boolean;
  className?: string;
}

export interface GuidedAnimationStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  animation: 'fadeIn' | 'slideIn' | 'scaleIn' | 'rotateIn' | 'bounceIn';
  duration: number;
  delay?: number;
  element?: React.ReactNode;
}

/**
 * Animated Icon Component
 */
export function AnimatedIcon({
  icon,
  type,
  size = 'md',
  color = 'text-blue-600',
  className,
}: AnimatedIconProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'h-4 w-4';
      case 'md': return 'h-6 w-6';
      case 'lg': return 'h-8 w-8';
      default: return 'h-6 w-6';
    }
  };

  const getAnimationClasses = () => {
    switch (type) {
      case 'pulse': return 'animate-pulse';
      case 'bounce': return 'animate-bounce';
      case 'spin': return 'animate-spin';
      case 'shake': return 'animate-shake';
      case 'heartbeat': return 'animate-heartbeat';
      case 'glow': return 'animate-glow';
      case 'float': return 'animate-float';
      default: return '';
    }
  };

  return (
    <div className={cn(
      "flex items-center justify-center",
      getSizeClasses(),
      color,
      getAnimationClasses(),
      className
    )}>
      {icon}
    </div>
  );
}

/**
 * Visual Feedback Component
 */
export function VisualFeedback({
  type,
  title,
  description,
  progress,
  animated = false,
  size = 'md',
  className,
}: VisualFeedbackProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const getTypeIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      case 'info':
        return <Info className="h-6 w-6 text-blue-600" />;
      case 'loading':
        return <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />;
      case 'progress':
        return <Activity className="h-6 w-6 text-purple-600" />;
      default:
        return <Info className="h-6 w-6 text-gray-600" />;
    }
  };

  const getTypeColors = () => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      case 'loading':
        return 'border-blue-200 bg-blue-50';
      case 'progress':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'p-3 text-sm';
      case 'md':
        return 'p-4 text-base';
      case 'lg':
        return 'p-6 text-lg';
      default:
        return 'p-4 text-base';
    }
  };

  return (
    <Card
      className={cn(
        "border-l-4 transition-all duration-300",
        getTypeColors(),
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        getSizeClasses(),
        className
      )}
    >
      <CardContent className="flex items-center gap-4">
        {animated ? (
          <AnimatedIcon icon={getTypeIcon()} type={type === 'loading' ? 'spin' : 'pulse'} />
        ) : (
          getTypeIcon()
        )}
        <div className="flex-1">
          <h4 className="font-medium">{title}</h4>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
          {progress !== undefined && (
            <div className="mt-3">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">Progress</span>
                <span className="text-xs font-medium">{Math.round(progress)}%</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Progress Animation Component
 */
export function ProgressAnimation({
  value,
  maxValue = 100,
  type,
  animated = true,
  showValue = true,
  color = 'blue',
  size = 'md',
  className,
}: ProgressAnimationProps) {
  const [currentValue, setCurrentValue] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setCurrentValue(value);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setCurrentValue(value);
    }
  }, [value, animated]);

  useEffect(() => {
    if (type === 'particles' && animated) {
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
      }));
      setParticles(newParticles);
    }
  }, [type, animated]);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-16 h-16';
      case 'md': return 'w-24 h-24';
      case 'lg': return 'w-32 h-32';
      default: return 'w-24 h-24';
    }
  };

  const getColorClasses = () => {
    const colors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      yellow: 'text-yellow-600',
      red: 'text-red-600',
      purple: 'text-purple-600',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (type === 'circular') {
    const percentage = (currentValue / maxValue) * 100;
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className={cn("relative flex items-center justify-center", getSizeClasses(), className)}>
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx="50%"
            cy="50%"
            r="45"
            stroke="currentColor"
            strokeWidth="10"
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx="50%"
            cy="50%"
            r="45"
            stroke="currentColor"
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn(getColorClasses(), "transition-all duration-1000 ease-out")}
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-semibold">{Math.round(percentage)}%</span>
          </div>
        )}
      </div>
    );
  }

  if (type === 'wave') {
    return (
      <div className={cn("relative overflow-hidden", getSizeClasses(), className)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-lg font-semibold">{Math.round((currentValue / maxValue) * 100)}%</div>
        </div>
        <svg className="absolute bottom-0 w-full h-full" preserveAspectRatio="none">
          <path
            d={`M0,${100 - (currentValue / maxValue) * 100} Q25,${100 - (currentValue / maxValue) * 100 + 10} 50,${100 - (currentValue / maxValue) * 100} T100,${100 - (currentValue / maxValue) * 100} L100,100 L0,100 Z`}
            className={cn("fill-current transition-all duration-1000 ease-out", getColorClasses())}
          />
        </svg>
      </div>
    );
  }

  if (type === 'particles') {
    return (
      <div className={cn("relative overflow-hidden", getSizeClasses(), className)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-lg font-semibold">{Math.round((currentValue / maxValue) * 100)}%</div>
        </div>
        <div className="absolute inset-0">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className={cn(
                "absolute rounded-full",
                getColorClasses(),
                "opacity-60",
                animated && "animate-float"
              )}
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Default linear progress
  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        <Progress value={(currentValue / maxValue) * 100} />
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-medium bg-white px-2 py-1 rounded">
              {Math.round((currentValue / maxValue) * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Step Indicator Component
 */
export function StepIndicator({
  steps,
  currentIndex,
  completed,
  animated = true,
  interactive = false,
  onStepClick,
  className,
}: StepIndicatorProps) {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const getStepStatus = (index: number) => {
    if (completed.includes(index)) return 'completed';
    if (index === currentIndex) return 'current';
    if (index < currentIndex) return 'completed';
    return 'pending';
  };

  const getStepIcon = (index: number) => {
    const status = getStepStatus(index);
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'current':
        return <Activity className="h-4 w-4" />;
      default:
        return <div className="h-4 w-4 border-2 border-current rounded-full" />;
    }
  };

  const getStepColors = (index: number) => {
    const status = getStepStatus(index);
    const isHovered = hoveredStep === index;

    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white border-green-500';
      case 'current':
        return 'bg-blue-500 text-white border-blue-500';
      default:
        return isHovered ? 'bg-gray-300 text-gray-700 border-gray-300' : 'bg-white text-gray-400 border-gray-300';
    }
  };

  return (
    <div className={cn("flex items-center justify-between w-full", className)}>
      {steps.map((step, index) => {
        const status = getStepStatus(index);
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 cursor-pointer",
                        getStepColors(index),
                        animated && status === 'current' && "animate-pulse",
                        interactive && "hover:scale-110"
                      )}
                      onClick={() => interactive && onStepClick?.(index)}
                      onMouseEnter={() => setHoveredStep(index)}
                      onMouseLeave={() => setHoveredStep(null)}
                    >
                      {getStepIcon(index)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="mt-2 text-xs text-center max-w-20">
                <div className={cn(
                  "font-medium",
                  status === 'completed' && "text-green-600",
                  status === 'current' && "text-blue-600",
                  status === 'pending' && "text-gray-400"
                )}>
                  Step {index + 1}
                </div>
                {animated && status === 'current' && (
                  <div className="flex items-center justify-center mt-1">
                    <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                  </div>
                )}
              </div>
            </div>

            {!isLast && (
              <div className={cn(
                "flex-1 h-0.5 mx-2 transition-all duration-300",
                completed.includes(index) ? "bg-green-500" : "bg-gray-300"
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * Guided Animation Component
 */
export function GuidedAnimation({
  steps,
  onComplete,
  autoPlay = false,
  loop = false,
  className,
}: GuidedAnimationProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isVisible, setIsVisible] = useState(false);

  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      } else if (loop) {
        setCurrentStepIndex(0);
      } else {
        setIsPlaying(false);
        onComplete?.();
      }
    }, currentStep.duration + (currentStep.delay || 0));

    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps, currentStep, loop, onComplete]);

  const getAnimationClass = (animation: string) => {
    switch (animation) {
      case 'fadeIn':
        return 'animate-fade-in';
      case 'slideIn':
        return 'animate-slide-in';
      case 'scaleIn':
        return 'animate-scale-in';
      case 'rotateIn':
        return 'animate-rotate-in';
      case 'bounceIn':
        return 'animate-bounce-in';
      default:
        return 'animate-fade-in';
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {currentStep.title}
            </CardTitle>
            <CardDescription>{currentStep.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {currentStepIndex + 1} / {steps.length}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="h-3 w-3" />
              ) : (
                <Play className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-h-[200px] flex items-center justify-center">
        <div
          className={cn(
            "transition-all duration-500 transform",
            getAnimationClass(currentStep.animation),
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}
        >
          {currentStep.element || (
            <div className="text-center">
              <AnimatedIcon
                icon={currentStep.icon}
                type="pulse"
                size="lg"
                color="text-blue-600"
              />
            </div>
          )}
        </div>
      </CardContent>
      <div className="px-6 pb-4">
        <Progress value={((currentStepIndex + 1) / steps.length) * 100} />
        <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
          <span>Step {currentStepIndex + 1}</span>
          <span>{Math.round(((currentStepIndex + 1) / steps.length) * 100)}%</span>
        </div>
      </div>
    </Card>
  );
}

/**
 * Success Celebration Component
 */
export function SuccessCelebration({
  title = "Success!",
  description,
  showConfetti = true,
  onComplete,
}: {
  title?: string;
  description?: string;
  showConfetti?: boolean;
  onComplete?: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => setShowCelebration(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showCelebration) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showCelebration, onComplete]);

  return (
    <Card className={cn(
      "border-green-200 bg-green-50 overflow-hidden",
      isVisible ? "animate-scale-in" : "opacity-0"
    )}>
      <CardContent className="p-8 text-center">
        <div className="flex justify-center mb-4">
          <AnimatedIcon
            icon={<Trophy className="h-12 w-12" />}
            type="bounce"
            color="text-yellow-500"
          />
        </div>

        <h2 className="text-2xl font-bold text-green-800 mb-2">{title}</h2>
        {description && (
          <p className="text-green-600 mb-6">{description}</p>
        )}

        <div className="flex justify-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <Star className="h-5 w-5 text-yellow-500" />
            <Star className="h-5 w-5 text-yellow-500" />
          </div>
        </div>

        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="absolute animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${3 + Math.random() * 2}s`,
                }}
              >
                {['🎉', '✨', '🎊', '⭐', '🌟'][Math.floor(Math.random() * 5)]}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Interactive Tutorial Component
 */
export function InteractiveTutorial({
  steps,
  onStart,
  onComplete,
  className,
}: {
  steps: Array<{
    title: string;
    content: React.ReactNode;
    position: 'top' | 'bottom' | 'left' | 'right' | 'center';
    highlight?: string;
  }>;
  onStart?: () => void;
  onComplete?: () => void;
  className?: string;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState<string | null>(null);

  const startTutorial = () => {
    setIsActive(true);
    onStart?.();
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsActive(false);
      onComplete?.();
    }
  };

  const skipTutorial = () => {
    setIsActive(false);
    onComplete?.();
  };

  const step = steps[currentStep];

  useEffect(() => {
    if (step?.highlight) {
      setHighlightedElement(step.highlight);
      // Highlight the element in the DOM
      const element = document.querySelector(step.highlight);
      if (element) {
        element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
        return () => {
          element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
        };
      }
    } else {
      setHighlightedElement(null);
    }
  }, [step]);

  if (!isActive) {
    return (
      <Card className={cn("border-blue-200 bg-blue-50", className)}>
        <CardContent className="p-6 text-center">
          <HelpCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
          <p className="text-blue-600 mb-4">
            Take a guided tour through the error recovery process
          </p>
          <Button onClick={startTutorial}>
            <Play className="h-4 w-4 mr-2" />
            Start Tutorial
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("fixed inset-0 z-50 bg-black/50", className)}>
      <div className={cn(
        "absolute bg-white rounded-lg shadow-lg p-6 max-w-md border-2 border-blue-500",
        step.position === 'center' && "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
        step.position === 'top' && "top-8 left-1/2 transform -translate-x-1/2",
        step.position === 'bottom' && "bottom-8 left-1/2 transform -translate-x-1/2",
      )}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
          <div className="text-sm text-muted-foreground">
            {step.content}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="outline">
            {currentStep + 1} / {steps.length}
          </Badge>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={skipTutorial}>
              Skip
            </Button>
            <Button size="sm" onClick={nextStep}>
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default {
  VisualFeedback,
  AnimatedIcon,
  ProgressAnimation,
  StepIndicator,
  GuidedAnimation,
  SuccessCelebration,
  InteractiveTutorial,
};
