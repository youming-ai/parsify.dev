/**
 * Error Recovery Tracking Hook
 * React hook for adding SC-009 error recovery tracking to tool components
 * Provides automatic error classification, recovery tracking, and SC-009 compliance monitoring
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ErrorEvent,
  ErrorType,
  ErrorCategory,
  ErrorSeverity,
  RecoveryStrategy,
  RecoveryAttempt,
  RecoveryGuidance,
  ErrorContext,
  ErrorRecoveryConfig,
  ErrorRecoveryAnalytics
} from '@/monitoring/error-recovery-types';
import { errorRecoveryIntegrationManager } from '@/monitoring/error-recovery-integration';

// ============================================================================
// Error Recovery Tracking Hook Interface
// ============================================================================

export interface UseErrorRecoveryTrackingOptions {
  toolId: string;
  sessionId?: string;
  userId?: string;
  autoClassify?: boolean;
  trackUserSatisfaction?: boolean;
  enableGuidance?: boolean;
  retryConfig?: {
    maxAttempts: number;
    autoRetry: boolean;
    retryDelay: number;
  };
  sc009?: {
    enabled: boolean;
    trackCompliance: boolean;
    alertOnNonCompliance: boolean;
  };
  callbacks?: {
    onError?: (error: Error, classification: any) => void;
    onRecoveryStart?: (attempt: RecoveryAttempt) => void;
    onRecoverySuccess?: (attempt: RecoveryAttempt) => void;
    onRecoveryFailure?: (attempt: RecoveryAttempt) => void;
    onSC009Risk?: (error: ErrorEvent) => void;
  };
}

export interface ErrorRecoveryState {
  currentError: Error | null;
  errorEvent: ErrorEvent | null;
  isRecovering: boolean;
  recoveryAttempts: RecoveryAttempt[];
  currentGuidance: RecoveryGuidance | null;
  userSatisfactionPrompt: boolean;
  sc009Compliant: boolean;
  analytics: ErrorRecoveryAnalytics;
}

export interface ErrorRecoveryActions {
  trackError: (error: Error, context?: Partial<ErrorContext>) => Promise<ErrorEvent>;
  attemptRecovery: (strategy?: RecoveryStrategy, userAction?: string) => Promise<RecoveryAttempt>;
  retryWithSameInput: () => Promise<RecoveryAttempt>;
  retryWithCorrectedInput: (correctedInput: any) => Promise<RecoveryAttempt>;
  requestGuidance: () => RecoveryGuidance | null;
  followGuidance: (guidanceId: string, followed: boolean) => void;
  submitFeedback: (helpful: boolean, rating?: number, comment?: string) => void;
  acknowledgeError: () => void;
  clearError: () => void;
  getRecoveryStrategies: () => RecoveryStrategy[];
  getSC009Status: () => { compliant: boolean; gap: number };
}

// ============================================================================
// Error Recovery Tracking Hook Implementation
// ============================================================================

export function useErrorRecoveryTracking(options: UseErrorRecoveryTrackingOptions): [
  ErrorRecoveryState,
  ErrorRecoveryActions
] {
  // State management
  const [state, setState] = useState<ErrorRecoveryState>({
    currentError: null,
    errorEvent: null,
    isRecovering: false,
    recoveryAttempts: [],
    currentGuidance: null,
    userSatisfactionPrompt: false,
    sc009Compliant: true,
    analytics: {
      totalErrors: 0,
      successfulRecoveries: 0,
      averageRecoveryTime: 0,
      userSatisfactionScore: 0,
      sc009ComplianceRate: 0
    }
  });

  // Refs for tracking
  const errorStartTime = useRef<number>(Date.now());
  const recoveryStartTime = useRef<number>(0);
  const currentAttemptId = useRef<string>('');
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize hook
  useEffect(() => {
    // Setup error recovery tracking
    if (options.sc009?.enabled) {
      console.log(`Error recovery tracking enabled for tool: ${options.toolId}`);
    }

    // Cleanup on unmount
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, [options.toolId, options.sc009?.enabled]);

  // Track error
  const trackError = useCallback(async (
    error: Error,
    context?: Partial<ErrorContext>
  ): Promise<ErrorEvent> => {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    errorStartTime.current = Date.now();

    // Build error context
    const errorContext: ErrorContext = {
      system: 'tool_component',
      component: options.toolId,
      operation: context?.operation || 'unknown',
      userId: options.userId,
      sessionId: options.sessionId || 'unknown',
      timestamp: new Date(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      additionalData: {
        ...context?.additionalData,
        hookVersion: '1.0.0',
        errorStack: error.stack
      }
    };

    // Create error event
    const errorEvent: ErrorEvent = {
      id: errorId,
      timestamp: new Date(),
      sessionId: errorContext.sessionId,
      userId: options.userId,
      toolId: options.toolId,
      operation: context?.operation,
      type: 'unknown_error', // Will be classified
      category: 'business_logic',
      severity: 'medium',
      message: error.message,
      stack: error.stack,
      context: errorContext,
      recoveryAttempts: [],
      finalOutcome: 'ongoing',
      totalRecoveryTime: 0,
      userSatisfied: false,
      sc009Compliant: true,
      complianceNotes: undefined
    };

    // Classify error if enabled
    if (options.autoClassify !== false) {
      try {
        const classification = await classifyError(error, errorContext);
        errorEvent.type = classification.type;
        errorEvent.category = classification.category;
        errorEvent.severity = classification.severity;
        errorEvent.recoveryStrategy = classification.recoveryStrategy;
        errorEvent.sc009Compliant = classification.sc009Compliant;
        errorEvent.complianceNotes = classification.confidence >= 0.8 ?
          `Auto-classified with ${(classification.confidence * 100).toFixed(0)}% confidence` :
          'Manual review recommended';
      } catch (classificationError) {
        console.warn('Error classification failed:', classificationError);
      }
    }

    // Update state
    setState(prevState => ({
      ...prevState,
      currentError: error,
      errorEvent,
      sc009Compliant: errorEvent.sc009Compliant,
      analytics: {
        ...prevState.analytics,
        totalErrors: prevState.analytics.totalErrors + 1
      }
    }));

    // Call error callback
    if (options.callbacks?.onError) {
      options.callbacks.onError(error, errorEvent);
    }

    // Check SC-009 compliance
    if (options.sc009?.enabled && options.sc009?.trackCompliance && !errorEvent.sc009Compliant) {
      if (options.callbacks?.onSC009Risk) {
        options.callbacks.onSC009Risk(errorEvent);
      }
    }

    // Send to integration manager
    try {
      errorRecoveryIntegrationManager.addErrorEvent(errorEvent);
    } catch (integrationError) {
      console.warn('Failed to send error to integration manager:', integrationError);
    }

    // Generate guidance if enabled
    if (options.enableGuidance && errorEvent.recoveryStrategy) {
      const guidance = await generateGuidance(errorEvent);
      if (guidance) {
        setState(prev => ({ ...prev, currentGuidance: guidance }));
      }
    }

    return errorEvent;
  }, [options]);

  // Attempt recovery
  const attemptRecovery = useCallback(async (
    strategy?: RecoveryStrategy,
    userAction?: string
  ): Promise<RecoveryAttempt> => {
    if (!state.errorEvent) {
      throw new Error('No error event to recover from');
    }

    const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    currentAttemptId.current = attemptId;
    recoveryStartTime.current = Date.now();

    const recoveryStrategy = strategy || state.errorEvent.recoveryStrategy || 'retry_with_same_input';

    const attempt: RecoveryAttempt = {
      id: attemptId,
      timestamp: new Date(),
      strategy: recoveryStrategy,
      automated: !userAction,
      duration: 0,
      success: false,
      guidanceProvided: state.currentGuidance || undefined,
      userFollowedGuidance: false,
      errorBefore: state.errorEvent.message,
      stepsTaken: [],
      effortLevel: 'medium'
    };

    setState(prev => ({
      ...prev,
      isRecovering: true,
      recoveryAttempts: [...prev.recoveryAttempts, attempt]
    }));

    // Call recovery start callback
    if (options.callbacks?.onRecoveryStart) {
      options.callbacks.onRecoveryStart(attempt);
    }

    try {
      // Execute recovery strategy
      const result = await executeRecoveryStrategy(recoveryStrategy, state.currentError!, userAction);

      // Update attempt with results
      attempt.success = result.success;
      attempt.duration = Date.now() - recoveryStartTime.current;
      attempt.errorAfter = result.success ? undefined : result.errorMessage;
      attempt.stepsTaken = result.steps || [];

      // Update state
      setState(prev => {
        const updatedAttempts = prev.recoveryAttempts.map(a =>
          a.id === attemptId ? attempt : a
        );

        const finalOutcome = result.success ?
          (attempt.strategy === 'retry_with_same_input' ? 'success_on_first_retry' : 'success_after_multiple_retries') :
          'ongoing';

        return {
          ...prev,
          recoveryAttempts: updatedAttempts,
          isRecovering: false,
          errorEvent: prev.errorEvent ? {
            ...prev.errorEvent,
            finalOutcome,
            totalRecoveryTime: Date.now() - errorStartTime.current,
            recoveryAttempts: updatedAttempts
          } : null
        };
      });

      // Call success/failure callbacks
      if (result.success && options.callbacks?.onRecoverySuccess) {
        options.callbacks.onRecoverySuccess(attempt);
      } else if (!result.success && options.callbacks?.onRecoveryFailure) {
        options.callbacks.onRecoveryFailure(attempt);
      }

      // Schedule user satisfaction prompt if enabled
      if (result.success && options.trackUserSatisfaction !== false) {
        scheduleSatisfactionPrompt();
      }

      return attempt;
    } catch (recoveryError) {
      attempt.success = false;
      attempt.duration = Date.now() - recoveryStartTime.current;
      attempt.errorAfter = recoveryError instanceof Error ? recoveryError.message : 'Unknown error';

      setState(prev => ({
        ...prev,
        isRecovering: false,
        recoveryAttempts: prev.recoveryAttempts.map(a =>
          a.id === attemptId ? attempt : a
        )
      }));

      if (options.callbacks?.onRecoveryFailure) {
        options.callbacks.onRecoveryFailure(attempt);
      }

      return attempt;
    }
  }, [state.errorEvent, state.currentError, state.currentGuidance, options]);

  // Retry with same input
  const retryWithSameInput = useCallback(async (): Promise<RecoveryAttempt> => {
    return attemptRecovery('retry_with_same_input', 'manual_retry');
  }, [attemptRecovery]);

  // Retry with corrected input
  const retryWithCorrectedInput = useCallback(async (correctedInput: any): Promise<RecoveryAttempt> => {
    // Store corrected input for the recovery attempt
    const attempt = await attemptRecovery('retry_with_corrected_input', 'corrected_input');

    // Add the corrected input to the attempt details
    if (attempt && state.errorEvent) {
      attempt.stepsTaken.push({
        action: 'input_correction',
        timestamp: new Date(),
        duration: 0,
        success: true,
        details: `Input corrected: ${JSON.stringify(correctedInput).substring(0, 100)}`
      });
    }

    return attempt;
  }, [attemptRecovery, state.errorEvent]);

  // Request guidance
  const requestGuidance = useCallback((): RecoveryGuidance | null => {
    if (!state.errorEvent) return null;

    // Generate or return existing guidance
    if (!state.currentGuidance) {
      generateGuidance(state.errorEvent).then(guidance => {
        if (guidance) {
          setState(prev => ({ ...prev, currentGuidance: guidance }));
        }
      });
    }

    return state.currentGuidance;
  }, [state.errorEvent, state.currentGuidance]);

  // Follow guidance
  const followGuidance = useCallback((guidanceId: string, followed: boolean): void => {
    setState(prev => {
      const updatedAttempts = prev.recoveryAttempts.map(attempt => {
        if (attempt.guidanceProvided && attempt.guidanceProvided.id === guidanceId) {
          return { ...attempt, userFollowedGuidance: followed };
        }
        return attempt;
      });

      return {
        ...prev,
        recoveryAttempts: updatedAttempts,
        errorEvent: prev.errorEvent ? {
          ...prev.errorEvent,
          recoveryAttempts: updatedAttempts
        } : null
      };
    });
  }, []);

  // Submit feedback
  const submitFeedback = useCallback((
    helpful: boolean,
    rating?: number,
    comment?: string
  ): void => {
    if (!state.errorEvent) return;

    const lastAttempt = state.recoveryAttempts[state.recoveryAttempts.length - 1];
    if (!lastAttempt) return;

    // Add feedback to the attempt
    lastAttempt.userFeedback = {
      helpful,
      clear: rating ? rating >= 4 : helpful,
      effective: helpful && (rating ? rating >= 3 : true),
      rating: rating || (helpful ? 4 : 2),
      comment,
      suggestions: comment ? [comment] : []
    };

    // Update analytics
    setState(prev => {
      const totalRatings = prev.analytics.userSatisfactionScore > 0 ? 1 : 0;
      const currentRating = prev.analytics.userSatisfactionScore;
      const newRating = rating || (helpful ? 4 : 2);
      const updatedRating = totalRatings > 0 ?
        (currentRating + newRating) / (totalRatings + 1) : newRating;

      return {
        ...prev,
        userSatisfactionPrompt: false,
        analytics: {
          ...prev.analytics,
          userSatisfactionScore: updatedRating
        }
      };
    });

    // Update error event
    setState(prev => ({
      ...prev,
      errorEvent: prev.errorEvent ? {
        ...prev.errorEvent,
        userSatisfied: helpful && (rating ? rating >= 3 : true)
      } : null
    }));

    // Cancel any existing feedback timeout
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
  }, [state.errorEvent, state.recoveryAttempts]);

  // Acknowledge error
  const acknowledgeError = useCallback((): void => {
    setState(prev => ({
      ...prev,
      userSatisfactionPrompt: false
    }));
  }, []);

  // Clear error
  const clearError = useCallback((): void => {
    setState(prev => ({
      ...prev,
      currentError: null,
      errorEvent: null,
      isRecovering: false,
      recoveryAttempts: [],
      currentGuidance: null,
      userSatisfactionPrompt: false
    }));

    // Cancel any existing feedback timeout
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
  }, []);

  // Get recovery strategies
  const getRecoveryStrategies = useCallback((): RecoveryStrategy[] => {
    if (!state.errorEvent) return [];

    // Return strategies based on error type and context
    const baseStrategies: RecoveryStrategy[] = [
      'retry_with_same_input',
      'retry_with_corrected_input',
      'guided_correction'
    ];

    // Add specific strategies based on error type
    switch (state.errorEvent.type) {
      case 'network_timeout':
        return [...baseStrategies, 'network_retry', 'cache_refresh'];
      case 'file_size_limit_exceeded':
        return [...baseStrategies, 'fallback_processing', 'guided_correction'];
      case 'invalid_input_format':
        return [...baseStrategies, 'format_conversion', 'guided_correction'];
      case 'unsupported_format':
        return [...baseStrategies, 'format_conversion', 'alternative_method'];
      default:
        return baseStrategies;
    }
  }, [state.errorEvent]);

  // Get SC-009 status
  const getSC009Status = useCallback((): { compliant: boolean; gap: number } => {
    const compliant = state.sc009Compliant &&
                     (state.analytics.sc009ComplianceRate >= 0.98);
    const gap = Math.max(0, 0.98 - state.analytics.sc009ComplianceRate);

    return { compliant, gap };
  }, [state.sc009Compliant, state.analytics.sc009ComplianceRate]);

  // Helper functions
  const scheduleSatisfactionPrompt = (): void => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    feedbackTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, userSatisfactionPrompt: true }));
    }, 5000); // 5 seconds after successful recovery
  };

  // Actions object
  const actions: ErrorRecoveryActions = {
    trackError,
    attemptRecovery,
    retryWithSameInput,
    retryWithCorrectedInput,
    requestGuidance,
    followGuidance,
    submitFeedback,
    acknowledgeError,
    clearError,
    getRecoveryStrategies,
    getSC009Status
  };

  return [state, actions];
}

// ============================================================================
// Helper Functions
// ============================================================================

async function classifyError(error: Error, context: ErrorContext): Promise<{
  type: ErrorType;
  category: ErrorCategory;
  severity: ErrorSeverity;
  recoveryStrategy: RecoveryStrategy;
  confidence: number;
  sc009Compliant: boolean;
}> {
  // This would typically use the error classification system
  // For now, provide basic classification based on error message

  const message = error.message.toLowerCase();
  let type: ErrorType = 'unknown_error';
  let category: ErrorCategory = 'business_logic';
  let severity: ErrorSeverity = 'medium';
  let strategy: RecoveryStrategy = 'retry_with_same_input';
  let confidence = 0.7;
  let sc009Compliant = true;

  // Classify based on error message patterns
  if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
    type = 'network_timeout';
    category = 'network';
    strategy = 'network_retry';
    confidence = 0.9;
  } else if (message.includes('size') || message.includes('large') || message.includes('limit')) {
    type = 'file_size_limit_exceeded';
    category = 'file_processing';
    strategy = 'guided_correction';
    confidence = 0.85;
  } else if (message.includes('format') || message.includes('invalid') || message.includes('parse')) {
    type = 'invalid_input_format';
    category = 'user_input';
    strategy = 'retry_with_corrected_input';
    confidence = 0.9;
  } else if (message.includes('permission') || message.includes('access') || message.includes('unauthorized')) {
    type = 'permission_denied';
    category = 'security';
    strategy = 'escalation';
    severity = 'high';
    confidence = 0.95;
    sc009Compliant = false; // Permission errors are harder to recover from
  }

  return { type, category, severity, recoveryStrategy: strategy, confidence, sc009Compliant };
}

async function generateGuidance(errorEvent: ErrorEvent): Promise<RecoveryGuidance | null> {
  // This would typically use the error classification system to generate guidance
  // For now, provide basic guidance based on error type

  const guidanceMap: Record<ErrorType, Partial<RecoveryGuidance>> = {
    'network_timeout': {
      type: 'troubleshooting_guide',
      title: 'Fix Network Issues',
      description: 'Network connection problems detected. Here\'s how to resolve them:',
      steps: [
        {
          order: 1,
          title: 'Check your connection',
          description: 'Verify your internet connection is working properly.',
          interactive: false
        },
        {
          order: 2,
          title: 'Retry the operation',
          description: 'Try the operation again. We\'ll automatically retry up to 3 times.',
          interactive: true,
          action: 'retry'
        }
      ],
      estimatedTime: 30,
      difficulty: 'easy'
    },
    'file_size_limit_exceeded': {
      type: 'interactive_tutorial',
      title: 'Reduce File Size',
      description: 'Your file exceeds the size limit. Let\'s help you reduce it:',
      steps: [
        {
          order: 1,
          title: 'Check current file size',
          description: 'Your file is currently larger than allowed.',
          interactive: false
        },
        {
          order: 2,
          title: 'Choose reduction method',
          description: 'Select how you\'d like to reduce the file size.',
          interactive: true,
          action: 'choose_method'
        }
      ],
      estimatedTime: 120,
      difficulty: 'medium'
    },
    'invalid_input_format': {
      type: 'step_by_step_instructions',
      title: 'Fix Input Format Issues',
      description: 'Your input doesn\'t match the required format. Here\'s how to fix it:',
      steps: [
        {
          order: 1,
          title: 'Review the requirements',
          description: 'Check the input requirements and format specifications.',
          interactive: false
        },
        {
          order: 2,
          title: 'Correct your input',
          description: 'Update your input to match the required format.',
          interactive: true,
          action: 'correct_input'
        }
      ],
      estimatedTime: 45,
      difficulty: 'easy'
    }
  };

  const baseGuidance = guidanceMap[errorEvent.type];
  if (!baseGuidance) return null;

  return {
    id: `guidance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: baseGuidance.type || 'step_by_step_instructions',
    title: baseGuidance.title || 'How to resolve this error',
    description: baseGuidance.description || 'Follow these steps to resolve the error.',
    steps: baseGuidance.steps || [],
    examples: [],
    resources: [],
    estimatedTime: baseGuidance.estimatedTime || 60,
    difficulty: baseGuidance.difficulty || 'medium'
  };
}

async function executeRecoveryStrategy(
  strategy: RecoveryStrategy,
  error: Error,
  userAction?: string
): Promise<{
  success: boolean;
  errorMessage?: string;
  steps?: Array<{
    action: string;
    timestamp: Date;
    duration: number;
    success: boolean;
    details?: string;
  }>;
}> {
  const startTime = Date.now();
  const steps: Array<{
    action: string;
    timestamp: Date;
    duration: number;
    success: boolean;
    details?: string;
  }> = [];

  try {
    switch (strategy) {
      case 'retry_with_same_input':
        steps.push({
          action: 'retry_operation',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          success: true,
          details: 'Retrying with same input'
        });

        // Simulate retry logic
        await new Promise(resolve => setTimeout(resolve, 1000));

        // For demo purposes, 70% success rate
        const success = Math.random() > 0.3;

        if (success) {
          return { success: true, steps };
        } else {
          return {
            success: false,
            errorMessage: 'Retry failed with same input',
            steps
          };
        }

      case 'retry_with_corrected_input':
        steps.push({
          action: 'correct_input',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          success: true,
          details: userAction ? `Corrected input: ${userAction}` : 'Input corrected by user'
        });

        // Simulate correction logic
        await new Promise(resolve => setTimeout(resolve, 500));

        return { success: true, steps };

      case 'network_retry':
        steps.push({
          action: 'check_network',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          success: true,
          details: 'Checking network connectivity'
        });

        // Simulate network check
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulate network retry
        const networkSuccess = Math.random() > 0.4; // 60% success rate

        if (networkSuccess) {
          steps.push({
            action: 'network_retry',
            timestamp: new Date(),
            duration: Date.now() - startTime,
            success: true,
            details: 'Network retry successful'
          });

          return { success: true, steps };
        } else {
          return {
            success: false,
            errorMessage: 'Network retry failed',
            steps
          };
        }

      default:
        steps.push({
          action: 'generic_recovery',
          timestamp: new Date(),
          duration: Date.now() - startTime,
          success: false,
          details: `Unknown recovery strategy: ${strategy}`
        });

        return {
          success: false,
          errorMessage: `Unknown recovery strategy: ${strategy}`,
          steps
        };
    }
  } catch (executionError) {
    return {
      success: false,
      errorMessage: executionError instanceof Error ? executionError.message : 'Unknown execution error',
      steps
    };
  }
}

export default useErrorRecoveryTracking;
