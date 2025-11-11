/**
 * withProgress Higher-Order Component
 * HOC for wrapping components with automatic progress tracking
 */

import React, { useEffect, useState, useCallback } from 'react';
import { ProgressOperation, ProgressType, ProgressUpdate } from '@/monitoring/progress-indicators-types';
import { progressManager } from '@/monitoring/progress-manager';
import { ProgressOverlay } from './ProgressOverlay';

interface WithProgressOptions {
  // Progress configuration
  progressType: ProgressType;
  showProgress?: boolean;
  showOverlay?: boolean;
  overlayConfig?: {
    closable?: boolean;
    backdrop?: boolean;
    title?: string;
  };

  // Operation metadata
  operationName?: string;
  operationDescription?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration?: number;
  allowCancellation?: boolean;

  // Progress calculation
  progressSteps?: number;
  getProgress?: (data: any) => number;
  getStepName?: (data: any) => string;

  // Error handling
  onError?: (error: Error) => void;
  onSuccess?: (result: any) => void;
  onComplete?: () => void;

  // Tool information
  toolId?: string;
  sessionId?: string;
  userId?: string;
}

interface WithProgressProps {
  // Props passed to the wrapped component
  [key: string]: any;

  // Progress tracking props
  onStartProgress?: () => void;
  onUpdateProgress?: (progress: number) => void;
  onCompleteProgress?: (result?: any) => void;
  onErrorProgress?: (error: Error) => void;
  onCancelProgress?: () => void;
}

interface WithProgressState {
  operationId?: string;
  operation?: ProgressOperation;
  isTracking: boolean;
}

export function withProgress<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithProgressOptions
) {
  const {
    progressType,
    showProgress = true,
    showOverlay = false,
    overlayConfig = {},
    operationName,
    operationDescription,
    priority = 'medium',
    estimatedDuration,
    allowCancellation = false,
    progressSteps = 100,
    getProgress,
    getStepName,
    onError,
    onSuccess,
    onComplete,
    toolId = 'unknown',
    sessionId,
    userId,
  } = options;

  return function WithProgressComponent(props: P & WithProgressProps) {
    const [state, setState] = useState<WithProgressState>({
      isTracking: false,
    });

    const [operationData, setOperationData] = useState<any>(null);
    const [error, setError] = useState<Error | null>(null);

    // Start progress tracking
    const startTracking = useCallback((data?: any) => {
      if (!showProgress) return;

      const operationNameToUse = operationName || getStepName?.(data) || 'Processing...';
      const operationDescriptionToUse = operationDescription || `${progressType} operation`;

      const operationId = progressManager.start({
        toolId,
        sessionId: sessionId || generateSessionId(),
        userId,
        name: operationNameToUse,
        description: operationDescriptionToUse,
        type: progressType,
        category: 'Security & Encryption Suite', // Default category
        priority,
        estimatedDuration,
        canCancel: allowCancellation,
        inputSize: data ? JSON.stringify(data).length : 0,
        metadata: {
          startTime: new Date(),
          component: WrappedComponent.name || 'UnknownComponent',
          ...data,
        },
      });

      setState({
        operationId,
        operation: progressManager.getOperation(operationId),
        isTracking: true,
      });

      setOperationData(data);
      setError(null);

      props.onStartProgress?.();

      return operationId;
    }, [toolId, sessionId, userId, priority, estimatedDuration, allowCancellation]);

    // Update progress
    const updateProgress = useCallback((update: ProgressUpdate | number) => {
      if (!state.isTracking || !state.operationId) return;

      let progressUpdate: ProgressUpdate;

      if (typeof update === 'number') {
        const progress = getProgress ? getProgress(operationData) : update;
        progressUpdate = {
          progress,
          stepName: getStepName?.(operationData),
        };
      } else {
        progressUpdate = update;
      }

      progressManager.update(state.operationId, progressUpdate);
      props.onUpdateProgress?.(progressUpdate.progress);

      // Update local operation state
      const updatedOperation = progressManager.getOperation(state.operationId);
      if (updatedOperation) {
        setState(prev => ({
          ...prev,
          operation: updatedOperation,
        }));
      }
    }, [state.isTracking, state.operationId, operationData, getProgress, getStepName]);

    // Complete progress tracking
    const completeTracking = useCallback((result?: any) => {
      if (!state.isTracking || !state.operationId) return;

      progressManager.complete(state.operationId, result);

      setState({
        operationId: undefined,
        operation: undefined,
        isTracking: false,
      });

      setOperationData(null);
      setError(null);

      props.onCompleteProgress?.(result);
      onSuccess?.(result);
      onComplete?.();
    }, [state.isTracking, state.operationId, onSuccess, onComplete]);

    // Error handling
    const handleError = useCallback((error: Error) => {
      if (!state.isTracking || !state.operationId) return;

      const progressError = {
        code: error.name || 'UNKNOWN_ERROR',
        message: error.message,
        details: error.stack,
        severity: 'high' as const,
        recoverable: true,
        suggestions: ['Please try again', 'Check your input and try again'],
        timestamp: new Date(),
      };

      progressManager.fail(state.operationId, progressError);

      setState({
        operationId: undefined,
        operation: undefined,
        isTracking: false,
      });

      setError(error);
      onError?.(error);
      props.onErrorProgress?.(error);
    }, [state.isTracking, state.operationId, onError]);

    // Cancel operation
    const cancelOperation = useCallback(() => {
      if (!state.isTracking || !state.operationId) return;

      progressManager.cancel(state.operationId, 'User cancelled');

      setState({
        operationId: undefined,
        operation: undefined,
        isTracking: false,
      });

      props.onCancelProgress?.();
    }, [state.isTracking, state.operationId]);

    // Auto-cleanup on unmount
    useEffect(() => {
      return () => {
        if (state.operationId) {
          progressManager.cancel(state.operationId, 'Component unmounted');
        }
      };
    }, [state.operationId]);

    // Enhanced props for wrapped component
    const enhancedProps = {
      ...props,
      // Progress tracking methods
      startProgress: startTracking,
      updateProgress,
      completeProgress: completeTracking,
      errorProgress: handleError,
      cancelProgress: cancelOperation,

      // Progress state
      isProgressActive: state.isTracking,
      currentOperation: state.operation,
      progressError: error,

      // Progress data
      progressData: operationData,
    } as P & WithProgressProps;

    return (
      <>
        <WrappedComponent {...enhancedProps} />

        {/* Progress overlay */}
        {showOverlay && state.operation && (
          <ProgressOverlay
            operations={[state.operation]}
            visible={state.isTracking}
            closable={allowCancellation}
            onClose={cancelOperation}
            title={overlayConfig.title || state.operation.name}
            backdrop={overlayConfig.backdrop ?? true}
          />
        )}
      </>
    );
  };
}

// Hook version for functional components
export function useProgress(options: WithProgressOptions) {
  const [state, setState] = useState<{
    operationId?: string;
    operation?: ProgressOperation;
    isTracking: boolean;
    error?: Error;
  }>({
    isTracking: false,
  });

  const [operationData, setOperationData] = useState<any>(null);

  const startTracking = useCallback((data?: any) => {
    const {
      progressType,
      operationName,
      operationDescription,
      priority = 'medium',
      estimatedDuration,
      allowCancellation = false,
      toolId = 'unknown',
      sessionId,
      userId,
      getStepName,
    } = options;

    const operationNameToUse = operationName || getStepName?.(data) || 'Processing...';
    const operationDescriptionToUse = operationDescription || `${progressType} operation`;

    const operationId = progressManager.start({
      toolId,
      sessionId: sessionId || generateSessionId(),
      userId,
      name: operationNameToUse,
      description: operationDescriptionToUse,
      type: progressType,
      category: 'Security & Encryption Suite',
      priority,
      estimatedDuration,
      canCancel: allowCancellation,
      inputSize: data ? JSON.stringify(data).length : 0,
      metadata: {
        startTime: new Date(),
        ...data,
      },
    });

    setState({
      operationId,
      operation: progressManager.getOperation(operationId),
      isTracking: true,
    });

    setOperationData(data);

    return operationId;
  }, [options]);

  const updateProgress = useCallback((update: ProgressUpdate | number) => {
    if (!state.isTracking || !state.operationId) return;

    let progressUpdate: ProgressUpdate;

    if (typeof update === 'number') {
      const progress = options.getProgress ? options.getProgress(operationData) : update;
      progressUpdate = {
        progress,
        stepName: options.getStepName?.(operationData),
      };
    } else {
      progressUpdate = update;
    }

    progressManager.update(state.operationId, progressUpdate);

    const updatedOperation = progressManager.getOperation(state.operationId);
    if (updatedOperation) {
      setState(prev => ({
        ...prev,
        operation: updatedOperation,
      }));
    }
  }, [state.isTracking, state.operationId, operationData, options]);

  const completeTracking = useCallback((result?: any) => {
    if (!state.isTracking || !state.operationId) return;

    progressManager.complete(state.operationId, result);

    setState({
      operationId: undefined,
      operation: undefined,
      isTracking: false,
      error: undefined,
    });

    setOperationData(null);

    options.onSuccess?.(result);
    options.onComplete?.();
  }, [state.isTracking, state.operationId, options]);

  const handleError = useCallback((error: Error) => {
    if (!state.isTracking || !state.operationId) return;

    const progressError = {
      code: error.name || 'UNKNOWN_ERROR',
      message: error.message,
      details: error.stack,
      severity: 'high' as const,
      recoverable: true,
      suggestions: ['Please try again', 'Check your input and try again'],
      timestamp: new Date(),
    };

    progressManager.fail(state.operationId, progressError);

    setState(prev => ({
      ...prev,
      operationId: undefined,
      operation: undefined,
      isTracking: false,
      error,
    }));

    setOperationData(null);

    options.onError?.(error);
  }, [state.isTracking, state.operationId, options]);

  const cancelOperation = useCallback(() => {
    if (!state.isTracking || !state.operationId) return;

    progressManager.cancel(state.operationId, 'User cancelled');

    setState({
      operationId: undefined,
      operation: undefined,
      isTracking: false,
      error: undefined,
    });

    setOperationData(null);
  }, [state.isTracking, state.operationId]);

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.operationId) {
        progressManager.cancel(state.operationId, 'Hook unmounted');
      }
    };
  }, [state.operationId]);

  return {
    // Methods
    startProgress: startTracking,
    updateProgress,
    completeProgress: completeTracking,
    errorProgress: handleError,
    cancelProgress: cancelOperation,

    // State
    isProgressActive: state.isTracking,
    currentOperation: state.operation,
    progressError: state.error,
    progressData: operationData,
  };
}

// Utility function to generate session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Preset configurations for common use cases
export const progressPresets = {
  // File processing
  fileUpload: {
    progressType: 'upload' as ProgressType,
    showProgress: true,
    showOverlay: false,
    operationName: 'Uploading file',
    priority: 'medium' as const,
    getProgress: (data: any) => data?.progress || 0,
  },

  fileProcessing: {
    progressType: 'processing' as ProgressType,
    showProgress: true,
    showOverlay: true,
    operationName: 'Processing file',
    priority: 'medium' as const,
    estimatedDuration: 5000,
  },

  // Code execution
  codeExecution: {
    progressType: 'execution' as ProgressType,
    showProgress: true,
    showOverlay: true,
    operationName: 'Executing code',
    priority: 'high' as const,
    estimatedDuration: 10000,
    allowCancellation: true,
    overlayConfig: {
      closable: true,
      title: 'Code Execution',
    },
  },

  // Data validation
  dataValidation: {
    progressType: 'validation' as ProgressType,
    showProgress: true,
    showOverlay: false,
    operationName: 'Validating data',
    priority: 'medium' as const,
    estimatedDuration: 1000,
  },

  // Network requests
  networkRequest: {
    progressType: 'network' as ProgressType,
    showProgress: true,
    showOverlay: false,
    operationName: 'Making request',
    priority: 'medium' as const,
    estimatedDuration: 3000,
    allowCancellation: true,
  },

  // Background tasks
  backgroundTask: {
    progressType: 'background' as ProgressType,
    showProgress: false,
    showOverlay: false,
    priority: 'low' as const,
  },
};

// Convenience wrappers
export const withFileUploadProgress = (component: React.ComponentType<any>) =>
  withProgress(component, progressPresets.fileUpload);

export const withFileProcessingProgress = (component: React.ComponentType<any>) =>
  withProgress(component, progressPresets.fileProcessing);

export const withCodeExecutionProgress = (component: React.ComponentType<any>) =>
  withProgress(component, progressPresets.codeExecution);

export const withDataValidationProgress = (component: React.ComponentType<any>) =>
  withProgress(component, progressPresets.dataValidation);

export const withNetworkRequestProgress = (component: React.ComponentType<any>) =>
  withProgress(component, progressPresets.networkRequest);
