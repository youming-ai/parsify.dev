/**
 * Error Recovery Guidance System - Index
 * Exports all components and utilities for the comprehensive error recovery system
 */

// Core Components
export { ErrorRecoveryGuidance, CompactRecoveryGuidance, RecoveryProgressIndicator } from './error-recovery-guidance';
export { InteractiveWalkthrough, JSONErrorWalkthrough } from './interactive-walkthrough';
export { CategoryGuidance, categoryGuidanceTemplates } from './category-guidance';
export { ProgressTracker, ProgressVisualization } from './progress-tracker';
export {
  VisualFeedback,
  AnimatedIcon,
  ProgressAnimation,
  StepIndicator,
  GuidedAnimation,
  SuccessCelebration,
  InteractiveTutorial,
} from './visual-feedback';
export { IntegratedErrorRecovery, ErrorRecoveryProvider } from './integrated-error-recovery';

// Types and Interfaces
export type {
  ErrorInfo,
  RecoveryStep,
  RecoveryStrategy,
  ErrorRecoveryResult,
} from '@/lib/error-recovery';

export type {
  RecoveryProgress,
  ProgressMetrics,
  ProgressStep,
  RecoveryHistory,
} from './progress-tracker';

export type {
  CategoryGuidanceTemplate,
  CategoryError,
  QuickFix,
  CategoryWalkthrough,
  CategoryResource,
} from './category-guidance';

export type {
  WalkthroughStep,
  WalkthroughAction,
  WalkthroughValidation,
  WalkthroughResource,
  InteractiveWalkthroughProps,
  WalkthroughResult,
  WalkthroughState,
} from './interactive-walkthrough';

export type {
  VisualFeedbackProps,
  AnimatedIconProps,
  ProgressAnimationProps,
  StepIndicatorProps,
  GuidedAnimationProps,
  GuidedAnimationStep,
} from './visual-feedback';

export type {
  IntegratedErrorRecoveryProps,
  ErrorRecoveryState,
} from './integrated-error-recovery';

// State Management
export {
  useRecoveryWorkflowManager,
  useRecoveryWorkflow,
  useRecoverySession,
} from '@/lib/recovery-workflow-manager';

export type {
  RecoveryWorkflowState,
  RecoveryWorkflowActions,
  RecoverySession,
  RecoveryUserPreferences,
  RecoveryAnalytics,
  UserInteraction,
  RecoveryContext,
  SessionMetadata,
  RecoveryReport,
  RecoverySystemHealth,
} from '@/lib/recovery-workflow-manager';

// Configuration and Constants
export const ERROR_RECOVERY_CONFIG = {
  // Default settings
  DEFAULT_AUTO_RECOVERY: false,
  DEFAULT_SHOW_PROGRESS: true,
  DEFAULT_ENABLE_ANIMATIONS: true,
  DEFAULT_MAX_HISTORY_SIZE: 100,
  DEFAULT_TIMEOUT: 30000, // 30 seconds

  // Category mappings
  CATEGORIES: {
    'JSON Processing': {
      icon: 'FileJson',
      color: 'green',
      priority: 1,
    },
    'Code Execution': {
      icon: 'Terminal',
      color: 'blue',
      priority: 2,
    },
    'File Processing': {
      icon: 'Database',
      color: 'purple',
      priority: 3,
    },
    'Network Tools': {
      icon: 'Globe',
      color: 'cyan',
      priority: 4,
    },
    'Text Processing': {
      icon: 'Type',
      color: 'orange',
      priority: 5,
    },
    'Security Tools': {
      icon: 'Shield',
      color: 'red',
      priority: 6,
    },
  },

  // Error severity levels
  SEVERITY_LEVELS: {
    critical: { value: 4, color: 'red', timeout: 0 },
    error: { value: 3, color: 'red', timeout: 10000 },
    warning: { value: 2, color: 'yellow', timeout: 5000 },
    info: { value: 1, color: 'blue', timeout: 3000 },
    debug: { value: 0, color: 'gray', timeout: 1000 },
  },

  // Recovery strategy templates
  STRATEGY_TEMPLATES: {
    auto_retry: {
      maxRetries: 3,
      delay: 1000,
      backoff: 'exponential',
    },
    manual_intervention: {
      requireUserAction: true,
      provideInstructions: true,
      showHelp: true,
    },
    alternative_approaches: {
      suggestAlternatives: true,
      fallbackStrategies: true,
      gracefulDegradation: true,
    },
  },

  // Performance monitoring
  PERFORMANCE: {
    enableMetrics: true,
    trackUserBehavior: true,
    enableAnalytics: true,
    reportErrors: true,
  },

  // Accessibility settings
  ACCESSIBILITY: {
    enableKeyboardNavigation: true,
    enableScreenReaderSupport: true,
    enableHighContrast: false,
    enableReducedMotion: false,
  },
} as const;

// Utility Functions
export class ErrorRecoveryUtils {
  /**
   * Determines the appropriate recovery strategy based on error type and context
   */
  static determineStrategy(error: ErrorInfo, context?: any): RecoveryStrategy | null {
    // Implementation would analyze error and return appropriate strategy
    return null;
  }

  /**
   * Estimates recovery time based on error complexity and historical data
   */
  static estimateRecoveryTime(error: ErrorInfo, strategy: RecoveryStrategy | null): number {
    if (!strategy) return 30000; // Default 30 seconds

    return strategy.steps.reduce((total, step) => {
      return total + (step.estimatedTime || 30) * 1000; // Convert to milliseconds
    }, 0);
  }

  /**
   * Calculates success probability based on historical data
   */
  static calculateSuccessProbability(error: ErrorInfo, strategy: RecoveryStrategy | null): number {
    // Implementation would use analytics data to calculate probability
    return strategy ? 0.75 : 0.5; // Default probabilities
  }

  /**
   * Generates user-friendly error messages
   */
  static generateUserMessage(error: ErrorInfo): { title: string; message: string; action: string } {
    const templates = {
      validation: {
        title: 'Input Validation Error',
        message: 'The data you provided doesn\'t match the expected format.',
        action: 'Please check your input and try again.',
      },
      network: {
        title: 'Connection Error',
        message: 'Unable to connect to the server or service.',
        action: 'Please check your internet connection and try again.',
      },
      processing: {
        title: 'Processing Error',
        message: 'An error occurred while processing your request.',
        action: 'Please try again or contact support if the problem persists.',
      },
      security: {
        title: 'Security Error',
        message: 'A security restriction was encountered.',
        action: 'Please ensure you have the necessary permissions.',
      },
      system: {
        title: 'System Error',
        message: 'An unexpected system error occurred.',
        action: 'Please refresh the page and try again.',
      },
    };

    const template = templates[error.type] || templates.system;
    return {
      ...template,
      message: error.severity === 'critical' ? error.message : template.message,
    };
  }

  /**
   * Formats duration in human-readable format
   */
  static formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Validates recovery strategy completeness
   */
  static validateStrategy(strategy: RecoveryStrategy): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!strategy.id) errors.push('Strategy ID is required');
    if (!strategy.errorType) errors.push('Error type is required');
    if (!strategy.steps || strategy.steps.length === 0) errors.push('At least one step is required');
    if (!strategy.successCriteria || strategy.successCriteria.length === 0) {
      errors.push('Success criteria are required');
    }

    strategy.steps?.forEach((step, index) => {
      if (!step.id) errors.push(`Step ${index + 1}: ID is required`);
      if (!step.title) errors.push(`Step ${index + 1}: Title is required`);
      if (!step.description) errors.push(`Step ${index + 1}: Description is required`);
      if (!step.action) errors.push(`Step ${index + 1}: Action is required`);
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Creates a recovery session context
   */
  static createSessionContext(error: ErrorInfo, toolId?: string, category?: string): any {
    return {
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      timestamp: new Date(),
      sessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      toolId,
      category,
      error: {
        type: error.type,
        severity: error.severity,
        code: error.code,
      },
    };
  }

  /**
   * Debounce function for rapid error handling
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Throttle function for performance optimization
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }
}

// React Hook for easy integration
export function useErrorRecoveryGuidance(error: ErrorInfo, options?: {
  toolId?: string;
  category?: string;
  autoStart?: boolean;
  onComplete?: (result: ErrorRecoveryResult) => void;
}) {
  const workflow = useRecoveryWorkflowManager();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      const strategy = ErrorRecoveryUtils.determineStrategy(error, options);
      const context = ErrorRecoveryUtils.createSessionContext(error, options?.toolId, options?.category);
      const newSessionId = workflow.startSession(error, strategy, context);
      setSessionId(newSessionId);

      if (options?.autoStart) {
        // Auto-start recovery logic here
      }
    }
  }, [error, options]);

  const session = useRecoverySession(sessionId || undefined);

  return {
    session: session.session,
    isActive: session.isActive,
    isCompleted: session.isCompleted,
    startRecovery: () => sessionId && workflow.resumeSession(sessionId),
    pauseRecovery: () => sessionId && workflow.pauseSession(sessionId),
    cancelRecovery: () => sessionId && workflow.cancelSession(sessionId),
    retryStep: (stepId: string) => session.retryStep(stepId),
    skipStep: (stepId: string) => session.skipStep(stepId),
    recordInteraction: session.recordInteraction,
  };
}

// CSS Custom Properties for animations and theming
export const ERROR_RECOVERY_STYLES = `
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slide-in {
    from { transform: translateY(10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @keyframes scale-in {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  @keyframes bounce-in {
    0% { transform: scale(0.3); opacity: 0; }
    50% { transform: scale(1.05); }
    70% { transform: scale(0.9); }
    100% { transform: scale(1); opacity: 1; }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  @keyframes glow {
    0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
    50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
  }

  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
    20%, 40%, 60%, 80% { transform: translateX(2px); }
  }

  .animate-fade-in { animation: fade-in 0.3s ease-out; }
  .animate-slide-in { animation: slide-in 0.3s ease-out; }
  .animate-scale-in { animation: scale-in 0.3s ease-out; }
  .animate-bounce-in { animation: bounce-in 0.5s ease-out; }
  .animate-float { animation: float 3s ease-in-out infinite; }
  .animate-glow { animation: glow 2s ease-in-out infinite; }
  .animate-heartbeat { animation: heartbeat 1.5s ease-in-out infinite; }
  .animate-shake { animation: shake 0.5s ease-in-out; }

  /* Recovery-specific styles */
  .recovery-step {
    transition: all 0.3s ease;
  }

  .recovery-step:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .recovery-progress {
    transition: width 0.3s ease;
  }

  .recovery-indicator {
    transition: all 0.2s ease;
  }

  .recovery-indicator.active {
    transform: scale(1.1);
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .recovery-step {
      border-width: 2px;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .animate-fade-in,
    .animate-slide-in,
    .animate-scale-in,
    .animate-bounce-in,
    .animate-float,
    .animate-glow,
    .animate-heartbeat,
    .animate-shake {
      animation: none;
    }
  }
`;

export default {
  // Components
  ErrorRecoveryGuidance,
  InteractiveWalkthrough,
  CategoryGuidance,
  ProgressTracker,
  VisualFeedback,
  IntegratedErrorRecovery,

  // Hooks
  useRecoveryWorkflowManager,
  useRecoveryWorkflow,
  useRecoverySession,
  useErrorRecoveryGuidance,

  // Utilities
  ErrorRecoveryUtils,
  ERROR_RECOVERY_CONFIG,
  ERROR_RECOVERY_STYLES,
};
