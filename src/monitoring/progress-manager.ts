/**
 * Progress Manager - T144 Implementation
 * Central state management and utilities for real-time progress tracking
 */

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import {
  ProgressOperation,
  ProgressState,
  ProgressActions,
  ProgressEvent,
  ProgressUpdate,
  ProgressStep,
  ProgressConfig,
  ProgressType,
  ProgressStatus,
  ToolProgressConfig,
  ProgressMetrics,
  ProgressAnalytics,
  ProgressError,
  estimateProgress,
  calculateEta,
  getProgressWeight,
  isActiveOperation,
  isCompletedOperation
} from './progress-indicators-types';

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_GLOBAL_CONFIG: ProgressConfig = {
  style: 'linear',
  size: 'md',
  variant: 'default',
  showLabel: true,
  showPercentage: true,
  showSteps: false,
  showTime: true,
  animate: true,
  updateInterval: 100, // 100ms
  smoothTransitions: true,
  autoHide: false,
  hideDelay: 2000, // 2 seconds
  slowOperationThreshold: 1000, // 1 second
  fastOperationThreshold: 100, // 100ms
  etaAccuracyThreshold: 80, // 80%
  announceProgress: true,
  announceInterval: 5000, // 5 seconds
  provideKeyboardNavigation: true,
  throttleUpdates: true,
  maxUpdateFrequency: 10, // 10 updates per second
  batchUpdates: true,
  batchSize: 5,
};

// Default tool configurations based on operation type
const DEFAULT_TOOL_CONFIGS: Record<string, ToolProgressConfig> = {
  // JSON Processing Tools
  'json-formatter': {
    toolId: 'json-formatter',
    defaultConfig: {
      ...DEFAULT_GLOBAL_CONFIG,
      style: 'linear',
      showEta: true,
      showThroughput: false,
    },
    operationConfigs: {
      validation: { style: 'dots', showPercentage: false },
      processing: { style: 'linear', showEta: true },
    },
    estimatedDurations: {
      validation: 200,
      processing: 500,
    },
    progressCalculation: {
      type: 'linear',
    },
  },
  'json-validator': {
    toolId: 'json-validator',
    defaultConfig: {
      ...DEFAULT_GLOBAL_CONFIG,
      style: 'circular',
      showSteps: false,
    },
    operationConfigs: {
      validation: { style: 'circular', showPercentage: true },
    },
    estimatedDurations: {
      validation: 300,
    },
    progressCalculation: {
      type: 'exponential',
    },
  },

  // Code Processing Tools
  'code-formatter': {
    toolId: 'code-formatter',
    defaultConfig: {
      ...DEFAULT_GLOBAL_CONFIG,
      style: 'linear',
      showSteps: true,
    },
    operationConfigs: {
      validation: { style: 'dots', showPercentage: false },
      processing: { style: 'linear', showSteps: true },
    },
    estimatedDurations: {
      validation: 500,
      processing: 1500,
    },
    progressCalculation: {
      type: 'linear',
      weights: { validation: 0.2, processing: 0.8 },
    },
  },
  'code-executor': {
    toolId: 'code-executor',
    defaultConfig: {
      ...DEFAULT_GLOBAL_CONFIG,
      style: 'steps',
      showEta: true,
      allowCancellation: true,
    },
    operationConfigs: {
      validation: { style: 'dots', showPercentage: false },
      execution: { style: 'steps', showEta: true, showThroughput: true },
    },
    estimatedDurations: {
      validation: 300,
      execution: 5000,
    },
    progressCalculation: {
      type: 'custom',
      weights: { validation: 0.1, execution: 0.8, output: 0.1 },
    },
  },

  // File Processing Tools
  'file-converter': {
    toolId: 'file-converter',
    defaultConfig: {
      ...DEFAULT_GLOBAL_CONFIG,
      style: 'linear',
      showThroughput: true,
      showEta: true,
    },
    operationConfigs: {
      upload: { style: 'linear', showThroughput: true },
      conversion: { style: 'linear', showEta: true },
      download: { style: 'linear', showThroughput: true },
    },
    estimatedDurations: {
      upload: 2000,
      conversion: 3000,
      download: 1500,
    },
    progressCalculation: {
      type: 'logarithmic',
    },
  },
  'image-compressor': {
    toolId: 'image-compressor',
    defaultConfig: {
      ...DEFAULT_GLOBAL_CONFIG,
      style: 'circular',
      showThroughput: true,
    },
    operationConfigs: {
      upload: { style: 'linear', showThroughput: true },
      compression: { style: 'circular', showEta: true },
      download: { style: 'linear', showThroughput: true },
    },
    estimatedDurations: {
      upload: 3000,
      compression: 5000,
      download: 2000,
    },
    progressCalculation: {
      type: 'exponential',
    },
  },

  // Network Tools
  'http-client': {
    toolId: 'http-client',
    defaultConfig: {
      ...DEFAULT_GLOBAL_CONFIG,
      style: 'timeline',
      allowCancellation: true,
    },
    operationConfigs: {
      network: { style: 'timeline', showEta: true, allowCancellation: true },
    },
    estimatedDurations: {
      network: 3000,
    },
    progressCalculation: {
      type: 'custom',
    },
  },
};

// ============================================================================
// Progress Manager Store
// ============================================================================

interface ProgressManagerState extends ProgressState, ProgressActions {
  // Internal state
  updateQueue: Map<string, ProgressUpdate[]>;
  updateTimers: Map<string, NodeJS.Timeout>;
  announcementTimers: Map<string, NodeJS.Timeout>;

  // Internal methods
  processUpdateQueue: (operationId: string) => void;
  announceProgress: (operation: ProgressOperation) => void;
  updateAnalytics: (operation: ProgressOperation, event: ProgressEvent) => void;
  generateOperationId: () => string;
  generateStepId: () => string;
}

export const useProgressManager = create<ProgressManagerState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        operations: {},
        activeOperations: [],
        completedOperations: [],
        globalConfig: DEFAULT_GLOBAL_CONFIG,
        toolConfigs: DEFAULT_TOOL_CONFIGS,
        analytics: {
          operationHistory: [],
          completionTimes: [],
          performancePatterns: {
            peakHours: [],
            slowOperations: [],
            frequentErrors: [],
          },
          durationPredictions: {},
          userBehavior: {
            averageWaitTime: 0,
            cancellationPoints: [],
            retryPatterns: {},
          },
        },
        listeners: {},
        updateQueue: new Map(),
        updateTimers: new Map(),
        announcementTimers: new Map(),

        // ============================================================================
        // Operation Management
        // ============================================================================

        startOperation: (operationData) => {
          const id = get().generateOperationId();
          const now = new Date();

          const operation: ProgressOperation = {
            ...operationData,
            id,
            createdAt: now,
            updatedAt: now,
            status: 'running',
            progress: 0,
          };

          // Set started time
          operation.startedAt = now;

          // Get tool-specific configuration
          const toolConfig = get().toolConfigs[operation.toolId];
          if (toolConfig) {
            const operationConfig = toolConfig.operationConfigs[operation.type];
            if (operationConfig) {
              operation.showProgress = operationConfig.showProgress ?? toolConfig.defaultConfig.showProgress;
              operation.showEta = operationConfig.showEta ?? toolConfig.defaultConfig.showEta;
              operation.showThroughput = operationConfig.showThroughput ?? toolConfig.defaultConfig.showThroughput;
              operation.allowCancellation = operationConfig.allowCancellation ?? toolConfig.defaultConfig.allowCancellation;
            }
          }

          set((state) => ({
            operations: { ...state.operations, [id]: operation },
            activeOperations: [...state.activeOperations, id],
          }));

          // Emit started event
          get().emitEvent(id, {
            type: 'started',
            operationId: id,
            timestamp: now,
            data: operation,
          });

          // Start ETA calculation if operation has estimated duration
          const estimatedDuration = toolConfig?.estimatedDurations[operation.type];
          if (estimatedDuration) {
            operation.estimatedDuration = estimatedDuration;
            operation.eta = new Date(now.getTime() + estimatedDuration);
          }

          return id;
        },

        updateProgress: (operationId, update) => {
          const state = get();
          const operation = state.operations[operationId];
          if (!operation) return;

          // Add to update queue for throttling
          const queue = state.updateQueue.get(operationId) || [];
          queue.push(update);
          state.updateQueue.set(operationId, queue);

          // Process queue if not throttling or if this is the first update
          if (!state.globalConfig.throttleUpdates || queue.length === 1) {
            state.processUpdateQueue(operationId);
          }
        },

        completeOperation: (operationId, result) => {
          const state = get();
          const operation = state.operations[operationId];
          if (!operation) return;

          const now = new Date();
          const duration = operation.startedAt ? now.getTime() - operation.startedAt.getTime() : 0;

          const updatedOperation: ProgressOperation = {
            ...operation,
            status: 'completed',
            progress: 100,
            actualDuration: duration,
            updatedAt: now,
            metadata: { ...operation.metadata, result },
          };

          set((prevState) => ({
            operations: { ...prevState.operations, [operationId]: updatedOperation },
            activeOperations: prevState.activeOperations.filter(id => id !== operationId),
            completedOperations: [...prevState.completedOperations, operationId],
          }));

          // Clean up timers
          state.cleanupTimers(operationId);

          // Emit completion event
          get().emitEvent(operationId, {
            type: 'completed',
            operationId,
            timestamp: now,
            data: { operation: updatedOperation, duration, result },
          });

          // Update analytics
          get().updateAnalytics(updatedOperation, {
            type: 'completed',
            operationId,
            timestamp: now,
            data: { duration, result },
          });
        },

        failOperation: (operationId, error) => {
          const state = get();
          const operation = state.operations[operationId];
          if (!operation) return;

          const now = new Date();
          const duration = operation.startedAt ? now.getTime() - operation.startedAt.getTime() : 0;

          const updatedOperation: ProgressOperation = {
            ...operation,
            status: 'failed',
            error,
            actualDuration: duration,
            updatedAt: now,
          };

          set((prevState) => ({
            operations: { ...prevState.operations, [operationId]: updatedOperation },
            activeOperations: prevState.activeOperations.filter(id => id !== operationId),
            completedOperations: [...prevState.completedOperations, operationId],
          }));

          // Clean up timers
          state.cleanupTimers(operationId);

          // Emit failure event
          get().emitEvent(operationId, {
            type: 'failed',
            operationId,
            timestamp: now,
            data: { operation: updatedOperation, error },
          });

          // Update analytics
          get().updateAnalytics(updatedOperation, {
            type: 'failed',
            operationId,
            timestamp: now,
            data: { error, duration },
          });
        },

        cancelOperation: (operationId, reason) => {
          const state = get();
          const operation = state.operations[operationId];
          if (!operation) return;

          const now = new Date();
          const duration = operation.startedAt ? now.getTime() - operation.startedAt.getTime() : 0;

          const updatedOperation: ProgressOperation = {
            ...operation,
            status: 'cancelled',
            actualDuration: duration,
            updatedAt: now,
            metadata: { ...operation.metadata, cancellationReason: reason },
          };

          set((prevState) => ({
            operations: { ...prevState.operations, [operationId]: updatedOperation },
            activeOperations: prevState.activeOperations.filter(id => id !== operationId),
            completedOperations: [...prevState.completedOperations, operationId],
          }));

          // Clean up timers
          state.cleanupTimers(operationId);

          // Emit cancellation event
          get().emitEvent(operationId, {
            type: 'cancelled',
            operationId,
            timestamp: now,
            data: { operation: updatedOperation, reason },
          });

          // Update analytics
          get().updateAnalytics(updatedOperation, {
            type: 'cancelled',
            operationId,
            timestamp: now,
            data: { reason, duration },
          });
        },

        pauseOperation: (operationId) => {
          const state = get();
          const operation = state.operations[operationId];
          if (!operation || operation.status !== 'running') return;

          const updatedOperation: ProgressOperation = {
            ...operation,
            status: 'paused',
            updatedAt: new Date(),
          };

          set((prevState) => ({
            operations: { ...prevState.operations, [operationId]: updatedOperation },
          }));

          get().emitEvent(operationId, {
            type: 'paused',
            operationId,
            timestamp: new Date(),
            data: { operation: updatedOperation },
          });
        },

        resumeOperation: (operationId) => {
          const state = get();
          const operation = state.operations[operationId];
          if (!operation || operation.status !== 'paused') return;

          const updatedOperation: ProgressOperation = {
            ...operation,
            status: 'running',
            updatedAt: new Date(),
          };

          set((prevState) => ({
            operations: { ...prevState.operations, [operationId]: updatedOperation },
          }));

          get().emitEvent(operationId, {
            type: 'resumed',
            operationId,
            timestamp: new Date(),
            data: { operation: updatedOperation },
          });
        },

        // ============================================================================
        // Step Management
        // ============================================================================

        addStep: (operationId, stepData) => {
          const state = get();
          const operation = state.operations[operationId];
          if (!operation) return '';

          const stepId = state.generateStepId();
          const step: ProgressStep = {
            ...stepData,
            id: stepId,
            status: 'pending',
            progress: 0,
          };

          // Add step to operation metadata
          const steps = operation.metadata?.steps || [];
          steps.push(step);

          set((prevState) => ({
            operations: {
              ...prevState.operations,
              [operationId]: {
                ...operation,
                metadata: { ...operation.metadata, steps },
                totalSteps: steps.length,
              },
            },
          }));

          return stepId;
        },

        updateStep: (operationId, stepId, update) => {
          const state = get();
          const operation = state.operations[operationId];
          if (!operation) return;

          const steps = operation.metadata?.steps || [];
          const stepIndex = steps.findIndex((s: ProgressStep) => s.id === stepId);
          if (stepIndex === -1) return;

          const updatedSteps = [...steps];
          updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], ...update };

          set((prevState) => ({
            operations: {
              ...prevState.operations,
              [operationId]: {
                ...operation,
                metadata: { ...operation.metadata, steps: updatedSteps },
              },
            },
          }));
        },

        completeStep: (operationId, stepId) => {
          const state = get();
          const operation = state.operations[operationId];
          if (!operation) return;

          const steps = operation.metadata?.steps || [];
          const stepIndex = steps.findIndex((s: ProgressStep) => s.id === stepId);
          if (stepIndex === -1) return;

          const updatedSteps = [...steps];
          updatedSteps[stepIndex] = {
            ...updatedSteps[stepIndex],
            status: 'completed',
            progress: 100,
          };

          // Update operation progress based on completed steps
          const completedSteps = updatedSteps.filter(s => s.status === 'completed').length;
          const stepProgress = (completedSteps / updatedSteps.length) * 100;

          set((prevState) => ({
            operations: {
              ...prevState.operations,
              [operationId]: {
                ...operation,
                metadata: { ...operation.metadata, steps: updatedSteps },
                currentStep: completedSteps,
                progress: Math.max(operation.progress, stepProgress),
              },
            },
          }));
        },

        // ============================================================================
        // Configuration Management
        // ============================================================================

        updateConfig: (configUpdate) => {
          set((state) => ({
            globalConfig: { ...state.globalConfig, ...configUpdate },
          }));
        },

        updateToolConfig: (toolId, configUpdate) => {
          set((state) => ({
            toolConfigs: {
              ...state.toolConfigs,
              [toolId]: { ...state.toolConfigs[toolId], ...configUpdate },
            },
          }));
        },

        // ============================================================================
        // Analytics and Metrics
        // ============================================================================

        getMetrics: (timeWindow = '24h') => {
          const state = get();
          const operations = Object.values(state.operations);
          const now = new Date();
          const windowStart = getTimeWindowStart(now, timeWindow);

          const operationsInWindow = operations.filter(op =>
            op.createdAt >= windowStart
          );

          return calculateMetrics(operationsInWindow, timeWindow);
        },

        getAnalytics: () => {
          return get().analytics;
        },

        // ============================================================================
        // Event Management
        // ============================================================================

        addEventListener: (operationId, callback) => {
          set((state) => {
            const listeners = state.listeners[operationId] || [];
            return {
              listeners: {
                ...state.listeners,
                [operationId]: [...listeners, callback],
              },
            };
          });
        },

        removeEventListener: (operationId, callback) => {
          set((state) => {
            const listeners = state.listeners[operationId] || [];
            const filteredListeners = listeners.filter(cb => cb !== callback);
            return {
              listeners: {
                ...state.listeners,
                [operationId]: filteredListeners,
              },
            };
          });
        },

        // ============================================================================
        // Cleanup and Maintenance
        // ============================================================================

        clearCompleted: (olderThan = new Date(Date.now() - 24 * 60 * 60 * 1000)) => {
          const state = get();
          const operations = state.operations;
          const completedIds = state.completedOperations;

          const toRemove = completedIds.filter(id => {
            const operation = operations[id];
            return operation && operation.updatedAt < olderThan;
          });

          const newOperations = { ...operations };
          const newCompletedIds = completedIds.filter(id => !toRemove.includes(id));

          toRemove.forEach(id => {
            delete newOperations[id];
            state.cleanupTimers(id);
          });

          set({
            operations: newOperations,
            completedOperations: newCompletedIds,
          });
        },

        reset: () => {
          const state = get();

          // Clear all timers
          Object.keys(state.updateTimers).forEach(id => state.cleanupTimers(id));

          // Reset state
          set({
            operations: {},
            activeOperations: [],
            completedOperations: [],
            updateQueue: new Map(),
            updateTimers: new Map(),
            announcementTimers: new Map(),
            listeners: {},
          });
        },

        // ============================================================================
        // Internal Methods
        // ============================================================================

        processUpdateQueue: (operationId) => {
          const state = get();
          const operation = state.operations[operationId];
          if (!operation) return;

          const queue = state.updateQueue.get(operationId) || [];
          if (queue.length === 0) return;

          // Process the latest updates
          const latestUpdate = queue[queue.length - 1];

          const now = new Date();
          let newProgress = operation.progress;
          let newEta = operation.eta;

          // Apply progress update
          if (latestUpdate.progress !== undefined) {
            newProgress = Math.min(100, Math.max(0, latestUpdate.progress));
          }

          // Apply step update
          if (latestUpdate.step) {
            const { current, total, name } = latestUpdate.step;
            newProgress = Math.max(newProgress, (current / total) * 100);
          }

          // Calculate ETA if progress has changed
          if (operation.startedAt && newProgress > operation.progress) {
            newEta = calculateEta({ ...operation, progress: newProgress });
          }

          // Calculate throughput if processing data
          let newThroughput = operation.throughput;
          if (latestUpdate.metadata?.processedSize && operation.startedAt) {
            const elapsedMs = now.getTime() - operation.startedAt.getTime();
            newThroughput = latestUpdate.metadata.processedSize / (elapsedMs / 1000); // bytes per second
          }

          const updatedOperation: ProgressOperation = {
            ...operation,
            progress: newProgress,
            eta: newEta,
            throughput: newThroughput,
            updatedAt: now,
            ...latestUpdate.metadata,
          };

          // Apply step information
          if (latestUpdate.step) {
            updatedOperation.currentStep = latestUpdate.step.current;
            updatedOperation.totalSteps = latestUpdate.step.total;
            updatedOperation.stepName = latestUpdate.step.name;
          }

          set((prevState) => ({
            operations: {
              ...prevState.operations,
              [operationId]: updatedOperation,
            },
            updateQueue: new Map(), // Clear queue after processing
          }));

          // Emit progress event
          get().emitEvent(operationId, {
            type: 'progress',
            operationId,
            timestamp: now,
            data: latestUpdate,
          });

          // Announce progress for accessibility
          if (state.globalConfig.announceProgress) {
            get().announceProgress(updatedOperation);
          }
        },

        announceProgress: (operation) => {
          const state = get();

          // Clear existing timer for this operation
          const existingTimer = state.announcementTimers.get(operation.id);
          if (existingTimer) {
            clearTimeout(existingTimer);
          }

          // Schedule next announcement
          const timer = setTimeout(() => {
            const announcement = getProgressAnnouncement(operation);
            if (announcement) {
              // Use aria-live region for screen readers
              announceToScreenReader(announcement);
            }

            // Schedule next announcement if operation is still active
            const currentOperation = get().operations[operation.id];
            if (currentOperation && isActiveOperation(currentOperation.status)) {
              get().announceProgress(currentOperation);
            }
          }, state.globalConfig.announceInterval);

          state.announcementTimers.set(operation.id, timer);
        },

        updateAnalytics: (operation, event) => {
          set((state) => {
            const analytics = { ...state.analytics };

            // Add to operation history
            analytics.operationHistory.push(operation);

            // Add completion times for completed operations
            if (event.type === 'completed' && operation.actualDuration) {
              analytics.completionTimes.push({
                toolId: operation.toolId,
                type: operation.type,
                duration: operation.actualDuration,
                inputSize: operation.inputSize || 0,
                timestamp: new Date(),
              });
            }

            // Update user behavior
            if (event.type === 'cancelled') {
              analytics.userBehavior.cancellationPoints.push({
                operationType: operation.type,
                averageProgress: operation.progress,
                reason: event.data?.reason || 'User cancelled',
              });
            }

            return { analytics };
          });
        },

        generateOperationId: () => {
          return `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        },

        generateStepId: () => {
          return `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        },

        emitEvent: (operationId, event: ProgressEvent) => {
          const state = get();
          const listeners = state.listeners[operationId] || [];

          listeners.forEach(callback => {
            try {
              callback(event);
            } catch (error) {
              console.error('Error in progress event listener:', error);
            }
          });
        },

        cleanupTimers: (operationId: string) => {
          const state = get();

          // Clear update timer
          const updateTimer = state.updateTimers.get(operationId);
          if (updateTimer) {
            clearTimeout(updateTimer);
            state.updateTimers.delete(operationId);
          }

          // Clear announcement timer
          const announcementTimer = state.announcementTimers.get(operationId);
          if (announcementTimer) {
            clearTimeout(announcementTimer);
            state.announcementTimers.delete(operationId);
          }
        },
      }),
      {
        name: 'progress-manager-storage',
        partialize: (state) => ({
          // Only persist configuration, not active operations
          globalConfig: state.globalConfig,
          toolConfigs: state.toolConfigs,
          analytics: state.analytics,
        }),
      }
    )
  )
);

// ============================================================================
// Utility Functions
// ============================================================================

function getTimeWindowStart(now: Date, timeWindow: string): Date {
  const windowMs = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  }[timeWindow] || 24 * 60 * 60 * 1000;

  return new Date(now.getTime() - windowMs);
}

function calculateMetrics(operations: ProgressOperation[], timeWindow: string): ProgressMetrics {
  const total = operations.length;
  if (total === 0) {
    return {
      totalOperations: 0,
      activeOperations: 0,
      completedOperations: 0,
      failedOperations: 0,
      cancelledOperations: 0,
      averageDuration: 0,
      medianDuration: 0,
      p95Duration: 0,
      p99Duration: 0,
      etaAccuracy: 0,
      estimationError: 0,
      abandonmentRate: 0,
      cancellationRate: 0,
      retryRate: 0,
      toolMetrics: {},
      typeMetrics: {},
      timeWindow,
      lastUpdated: new Date(),
    };
  }

  const active = operations.filter(op => isActiveOperation(op.status));
  const completed = operations.filter(op => op.status === 'completed');
  const failed = operations.filter(op => op.status === 'failed');
  const cancelled = operations.filter(op => op.status === 'cancelled');

  // Duration calculations
  const durations = completed
    .map(op => op.actualDuration || 0)
    .filter(d => d > 0)
    .sort((a, b) => a - b);

  const averageDuration = durations.length > 0
    ? durations.reduce((sum, d) => sum + d, 0) / durations.length
    : 0;

  const medianDuration = durations.length > 0
    ? durations[Math.floor(durations.length / 2)]
    : 0;

  const p95Duration = durations.length > 0
    ? durations[Math.floor(durations.length * 0.95)]
    : 0;

  const p99Duration = durations.length > 0
    ? durations[Math.floor(durations.length * 0.99)]
    : 0;

  // Tool-specific metrics
  const toolGroups = new Map<string, ProgressOperation[]>();
  operations.forEach(op => {
    const group = toolGroups.get(op.toolId) || [];
    group.push(op);
    toolGroups.set(op.toolId, group);
  });

  const toolMetrics: Record<string, any> = {};
  toolGroups.forEach((toolOps, toolId) => {
    const toolCompleted = toolOps.filter(op => op.status === 'completed');
    const toolFailed = toolOps.filter(op => op.status === 'failed');
    const toolDurations = toolCompleted
      .map(op => op.actualDuration || 0)
      .filter(d => d > 0);

    toolMetrics[toolId] = {
      operations: toolOps.length,
      averageDuration: toolDurations.length > 0
        ? toolDurations.reduce((sum, d) => sum + d, 0) / toolDurations.length
        : 0,
      successRate: toolOps.length > 0 ? toolCompleted.length / toolOps.length : 0,
      userSatisfaction: calculateSatisfactionScore(toolCompleted),
    };
  });

  // Type-specific metrics
  const typeGroups = new Map<ProgressType, ProgressOperation[]>();
  operations.forEach(op => {
    const group = typeGroups.get(op.type) || [];
    group.push(op);
    typeGroups.set(op.type, group);
  });

  const typeMetrics: Record<string, any> = {};
  typeGroups.forEach((typeOps, type) => {
    const typeCompleted = typeOps.filter(op => op.status === 'completed');
    const typeDurations = typeCompleted
      .map(op => op.actualDuration || 0)
      .filter(d => d > 0);

    typeMetrics[type] = {
      operations: typeOps.length,
      averageDuration: typeDurations.length > 0
        ? typeDurations.reduce((sum, d) => sum + d, 0) / typeDurations.length
        : 0,
      accuracy: calculateEtaAccuracy(typeCompleted),
    };
  });

  return {
    totalOperations: total,
    activeOperations: active.length,
    completedOperations: completed.length,
    failedOperations: failed.length,
    cancelledOperations: cancelled.length,
    averageDuration,
    medianDuration,
    p95Duration,
    p99Duration,
    etaAccuracy: calculateEtaAccuracy(completed),
    estimationError: calculateEstimationError(completed),
    abandonmentRate: total > 0 ? cancelled.length / total : 0,
    cancellationRate: total > 0 ? cancelled.length / total : 0,
    retryRate: calculateRetryRate(operations),
    toolMetrics,
    typeMetrics,
    timeWindow,
    lastUpdated: new Date(),
  };
}

function calculateSatisfactionScore(completed: ProgressOperation[]): number {
  // Placeholder for user satisfaction calculation
  // In a real implementation, this would come from user ratings or implicit feedback
  return completed.length > 0 ? 4.2 : 0; // Average score out of 5
}

function calculateEtaAccuracy(completed: ProgressOperation[]): number {
  if (completed.length === 0) return 0;

  let totalAccuracy = 0;
  let count = 0;

  completed.forEach(op => {
    if (op.estimatedDuration && op.actualDuration) {
      const accuracy = 1 - Math.abs(op.estimatedDuration - op.actualDuration) / op.estimatedDuration;
      totalAccuracy += Math.max(0, Math.min(1, accuracy));
      count++;
    }
  });

  return count > 0 ? totalAccuracy / count : 0;
}

function calculateEstimationError(completed: ProgressOperation[]): number {
  if (completed.length === 0) return 0;

  let totalError = 0;
  let count = 0;

  completed.forEach(op => {
    if (op.estimatedDuration && op.actualDuration) {
      const error = Math.abs(op.estimatedDuration - op.actualDuration) / op.estimatedDuration;
      totalError += error;
      count++;
    }
  });

  return count > 0 ? (totalError / count) * 100 : 0; // Return as percentage
}

function calculateRetryRate(operations: ProgressOperation[]): number {
  const sessionGroups = new Map<string, ProgressOperation[]>();

  operations.forEach(op => {
    if (op.sessionId) {
      const sessionOps = sessionGroups.get(op.sessionId) || [];
      sessionOps.push(op);
      sessionGroups.set(op.sessionId, sessionOps);
    }
  });

  let sessionsWithRetries = 0;
  let totalSessions = sessionGroups.size;

  sessionGroups.forEach(sessionOps => {
    const toolGroups = new Map<string, ProgressOperation[]>();

    sessionOps.forEach(op => {
      const toolOps = toolGroups.get(op.toolId) || [];
      toolOps.push(op);
      toolGroups.set(op.toolId, toolOps);
    });

    const hasRetries = Array.from(toolGroups.values()).some(toolOps => toolOps.length > 1);
    if (hasRetries) sessionsWithRetries++;
  });

  return totalSessions > 0 ? sessionsWithRetries / totalSessions : 0;
}

function getProgressAnnouncement(operation: ProgressOperation): string | null {
  if (!isActiveOperation(operation.status)) return null;

  const { name, progress, stepName, eta } = operation;
  let announcement = `${name}: ${Math.round(progress)}% complete`;

  if (stepName) {
    announcement += `. Current step: ${stepName}`;
  }

  if (eta) {
    const timeRemaining = eta.getTime() - Date.now();
    const minutes = Math.floor(timeRemaining / (60 * 1000));
    const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);

    if (minutes > 0) {
      announcement += `. Estimated ${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
    } else if (seconds > 0) {
      announcement += `. Estimated ${seconds} seconds remaining`;
    }
  }

  return announcement;
}

function announceToScreenReader(message: string): void {
  // Create or use existing aria-live region
  let announcementRegion = document.getElementById('progress-announcements');
  if (!announcementRegion) {
    announcementRegion = document.createElement('div');
    announcementRegion.id = 'progress-announcements';
    announcementRegion.setAttribute('aria-live', 'polite');
    announcementRegion.setAttribute('aria-atomic', 'true');
    announcementRegion.className = 'sr-only';
    document.body.appendChild(announcementRegion);
  }

  announcementRegion.textContent = message;
}

// ============================================================================
// Convenience Functions
// ============================================================================

export const progressManager = {
  // Operation shortcuts
  start: (operationData: Omit<ProgressOperation, 'id' | 'createdAt' | 'updatedAt'>) =>
    useProgressManager.getState().startOperation(operationData),

  update: (operationId: string, update: ProgressUpdate) =>
    useProgressManager.getState().updateProgress(operationId, update),

  complete: (operationId: string, result?: any) =>
    useProgressManager.getState().completeOperation(operationId, result),

  fail: (operationId: string, error: ProgressError) =>
    useProgressManager.getState().failOperation(operationId, error),

  cancel: (operationId: string, reason?: string) =>
    useProgressManager.getState().cancelOperation(operationId, reason),

  // Getters
  getOperation: (id: string) => useProgressManager.getState().operations[id],
  getActiveOperations: () => {
    const state = useProgressManager.getState();
    return state.activeOperations.map(id => state.operations[id]).filter(Boolean);
  },
  getMetrics: (timeWindow?: string) => useProgressManager.getState().getMetrics(timeWindow),

  // Configuration
  updateConfig: (config: Partial<ProgressConfig>) =>
    useProgressManager.getState().updateConfig(config),

  // Analytics
  getAnalytics: () => useProgressManager.getState().getAnalytics(),

  // Cleanup
  clearCompleted: (olderThan?: Date) =>
    useProgressManager.getState().clearCompleted(olderThan),
  reset: () => useProgressManager.getState().reset(),
};

// Export hooks for React components
export const useProgressOperations = () => useProgressManager(state => ({
  operations: state.operations,
  activeOperations: state.activeOperations.map(id => state.operations[id]).filter(Boolean),
  completedOperations: state.completedOperations.map(id => state.operations[id]).filter(Boolean),
}));

export const useProgressOperation = (id: string) =>
  useProgressManager(state => state.operations[id]);

export const useProgressConfig = () =>
  useProgressManager(state => state.globalConfig);

export const useProgressMetrics = (timeWindow?: string) =>
  useProgressManager(state => state.getMetrics(timeWindow));
