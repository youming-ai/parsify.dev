/**
 * Progress Provider Component
 * Context provider for global progress state and configuration
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ProgressOperation, ProgressConfig, ProgressEvent, ProgressUpdate } from '@/monitoring/progress-indicators-types';
import { progressManager, useProgressManager } from '@/monitoring/progress-manager';

interface ProgressContextValue {
  // Global state
  operations: Record<string, ProgressOperation>;
  activeOperations: ProgressOperation[];
  globalConfig: ProgressConfig;

  // Global methods
  updateGlobalConfig: (config: Partial<ProgressConfig>) => void;

  // Operation methods
  getOperation: (id: string) => ProgressOperation | undefined;
  updateOperation: (id: string, update: ProgressUpdate) => void;
  completeOperation: (id: string, result?: any) => void;
  failOperation: (id: string, error: any) => void;
  cancelOperation: (id: string, reason?: string) => void;

  // Event handling
  addEventListener: (operationId: string, callback: (event: ProgressEvent) => void) => void;
  removeEventListener: (operationId: string, callback: (event: ProgressEvent) => void) => void;

  // Analytics
  getMetrics: (timeWindow?: string) => any;
  clearCompleted: (olderThan?: Date) => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

interface ProgressProviderProps {
  children: ReactNode;
  defaultConfig?: Partial<ProgressConfig>;
  enableAutoCleanup?: boolean;
  cleanupInterval?: number; // minutes
  maxCompletedAge?: number; // minutes
}

export const ProgressProvider: React.FC<ProgressProviderProps> = ({
  children,
  defaultConfig,
  enableAutoCleanup = true,
  cleanupInterval = 10, // 10 minutes
  maxCompletedAge = 60, // 60 minutes
}) => {
  const store = useProgressManager();
  const [activeOperations, setActiveOperations] = useState<ProgressOperation[]>([]);

  // Update global configuration on mount
  useEffect(() => {
    if (defaultConfig) {
      store.updateConfig(defaultConfig);
    }
  }, [defaultConfig, store.updateConfig]);

  // Update active operations list
  useEffect(() => {
    const operations = store.activeOperations.map(id => store.operations[id]).filter(Boolean) as ProgressOperation[];
    setActiveOperations(operations);
  }, [store.operations, store.activeOperations]);

  // Auto-cleanup completed operations
  useEffect(() => {
    if (!enableAutoCleanup) return;

    const interval = setInterval(() => {
      const cutoffDate = new Date(Date.now() - maxCompletedAge * 60 * 1000);
      store.clearCompleted(cutoffDate);
    }, cleanupInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [enableAutoCleanup, cleanupInterval, maxCompletedAge, store.clearCompleted]);

  // Context value
  const contextValue: ProgressContextValue = {
    // Global state
    operations: store.operations,
    activeOperations,
    globalConfig: store.globalConfig,

    // Global methods
    updateGlobalConfig: store.updateConfig,

    // Operation methods
    getOperation: (id: string) => store.operations[id],
    updateOperation: store.updateProgress,
    completeOperation: store.completeOperation,
    failOperation: store.failOperation,
    cancelOperation: store.cancelOperation,

    // Event handling
    addEventListener: store.addEventListener,
    removeEventListener: store.removeEventListener,

    // Analytics
    getMetrics: store.getMetrics,
    clearCompleted: store.clearCompleted,
  };

  return (
    <ProgressContext.Provider value={contextValue}>
      {children}
    </ProgressContext.Provider>
  );
};

// Hook for using progress context
export const useProgress = (): ProgressContextValue => {
  const context = useContext(ProgressContext);

  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }

  return context;
};

// Hook for operations by type
export const useOperationsByType = (type?: string) => {
  const { operations } = useProgress();

  return React.useMemo(() => {
    const allOperations = Object.values(operations);
    return type ? allOperations.filter(op => op.type === type) : allOperations;
  }, [operations, type]);
};

// Hook for active operations
export const useActiveOperations = () => {
  const { activeOperations } = useProgress();
  return activeOperations;
};

// Hook for specific operation
export const useOperation = (id: string) => {
  const { operations } = useProgress();

  return React.useMemo(() => {
    return operations[id];
  }, [operations, id]);
};

// Hook for operation events
export const useOperationEvents = (
  operationId: string,
  eventTypes?: string[]
) => {
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const { addEventListener, removeEventListener } = useProgress();

  useEffect(() => {
    if (!operationId) return;

    const handleEvent = (event: ProgressEvent) => {
      if (!eventTypes || eventTypes.includes(event.type)) {
        setEvents(prev => [...prev, event]);
      }
    };

    addEventListener(operationId, handleEvent);

    return () => {
      removeEventListener(operationId, handleEvent);
    };
  }, [operationId, eventTypes, addEventListener, removeEventListener]);

  return events;
};

// Hook for global progress metrics
export const useProgressMetrics = (timeWindow?: string) => {
  const { getMetrics } = useProgress();
  const [metrics, setMetrics] = useState(getMetrics(timeWindow));

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(getMetrics(timeWindow));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [getMetrics, timeWindow]);

  return metrics;
};

// Hook for progress configuration
export const useProgressConfig = () => {
  const { globalConfig, updateGlobalConfig } = useProgress();

  const updateConfig = React.useCallback((config: Partial<ProgressConfig>) => {
    updateGlobalConfig(config);
  }, [updateGlobalConfig]);

  return [globalConfig, updateConfig] as const;
};

// Hook for operation with auto-cleanup
export const useOperationWithCleanup = (
  operationId: string,
  cleanupDelay = 2000 // 2 seconds
) => {
  const operation = useOperation(operationId);
  const { cancelOperation } = useProgress();

  useEffect(() => {
    if (operation?.status === 'completed' || operation?.status === 'failed') {
      const timer = setTimeout(() => {
        // Clean up the operation after delay
        cancelOperation(operationId, 'Auto-cleanup');
      }, cleanupDelay);

      return () => clearTimeout(timer);
    }
  }, [operation, operationId, cleanupDelay, cancelOperation]);

  return operation;
};

// Progress consumer component for conditional rendering
export interface ProgressConsumerProps {
  children: (context: ProgressContextValue) => ReactNode;
  fallback?: ReactNode;
}

export const ProgressConsumer: React.FC<ProgressConsumerProps> = ({
  children,
  fallback = null,
}) => {
  return (
    <ProgressContext.Consumer>
      {(context) => {
        if (!context) {
          return fallback;
        }
        return children(context);
      }}
    </ProgressContext.Consumer>
  );
};

// HOC for providing progress context
export const withProgressProvider = <P extends object>(
  Component: React.ComponentType<P>,
  providerProps?: Partial<ProgressProviderProps>
) => {
  const WrappedComponent = (props: P) => (
    <ProgressProvider {...providerProps}>
      <Component {...props} />
    </ProgressProvider>
  );

  WrappedComponent.displayName = `withProgressProvider(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

// Utility functions for common patterns
export const useProgressOperation = (
  operationData: Omit<ProgressOperation, 'id' | 'createdAt' | 'updatedAt'>
) => {
  const { operations, updateOperation, completeOperation, failOperation } = useProgress();
  const [operationId, setOperationId] = useState<string>();

  const start = React.useCallback(() => {
    const id = progressManager.start(operationData);
    setOperationId(id);
    return id;
  }, [operationData]);

  const update = React.useCallback((update: ProgressUpdate) => {
    if (operationId) {
      updateOperation(operationId, update);
    }
  }, [operationId, updateOperation]);

  const complete = React.useCallback((result?: any) => {
    if (operationId) {
      completeOperation(operationId, result);
    }
  }, [operationId, completeOperation]);

  const fail = React.useCallback((error: any) => {
    if (operationId) {
      failOperation(operationId, error);
    }
  }, [operationId, failOperation]);

  const operation = React.useMemo(() => {
    return operationId ? operations[operationId] : undefined;
  }, [operations, operationId]);

  return {
    operation,
    operationId,
    start,
    update,
    complete,
    fail,
  };
};

// Progress provider with error boundary
export interface ProgressProviderWithErrorBoundaryProps extends ProgressProviderProps {
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export const ProgressProviderWithErrorBoundary: React.FC<ProgressProviderWithErrorBoundaryProps> = ({
  children,
  fallback,
  onError,
  ...providerProps
}) => {
  return (
    <ProgressProvider {...providerProps}>
      <ProgressErrorBoundary fallback={fallback} onError={onError}>
        {children}
      </ProgressErrorBoundary>
    </ProgressProvider>
  );
};

// Error boundary for progress operations
class ProgressErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode; onError?: (error: Error, errorInfo: React.ErrorInfo) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong with the progress tracking.</div>;
    }

    return this.props.children;
  }
}
