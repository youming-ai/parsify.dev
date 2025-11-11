/**
 * Real-time Progress Indicators System - T144 Implementation
 * Comprehensive types and interfaces for progress tracking across all tools
 */

import { ToolCategory } from '@/types/tools';

// ============================================================================
// Core Progress Types
// ============================================================================

export type ProgressStatus = 'idle' | 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export type ProgressType =
  | 'validation'     // Input validation and syntax checking
  | 'processing'     // Main data transformation/processing
  | 'conversion'     // Format conversion operations
  | 'upload'         // File upload operations
  | 'download'       // File download operations
  | 'analysis'       // Data analysis and inspection
  | 'optimization'   // Code/data optimization
  | 'compression'    // File/image compression
  | 'execution'      // Code execution
  | 'network'        // Network requests and API calls
  | 'indexing'       // Search indexing and data preparation
  | 'rendering'      // Visual rendering operations
  | 'background';    // Background tasks and maintenance

export type ProgressStyle =
  | 'linear'         // Standard horizontal progress bar
  | 'circular'       // Circular/radial progress indicator
  | 'skeleton'       // Skeleton loading states
  | 'dots'           // Animated dots indicator
  | 'pulse'          // Pulsing animation
  | 'spinner'        // Spinning loader
  | 'steps'          // Step-by-step progress
  | 'timeline'       // Timeline-based progress
  | 'overlay'        // Full-screen overlay progress
  | 'inline';        // Inline text-based progress

export type ProgressSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ProgressVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

// ============================================================================
// Progress Operation Definition
// ============================================================================

export interface ProgressOperation {
  // Core identification
  id: string;
  toolId: string;
  sessionId: string;
  userId?: string;

  // Operation metadata
  name: string;
  description: string;
  type: ProgressType;
  category: ToolCategory;
  priority: 'low' | 'medium' | 'high' | 'critical';

  // Progress tracking
  status: ProgressStatus;
  progress: number; // 0-100
  currentStep?: number;
  totalSteps?: number;
  stepName?: string;

  // Timing information
  createdAt: Date;
  startedAt?: Date;
  updatedAt: Date;
  estimatedDuration?: number; // milliseconds
  actualDuration?: number; // milliseconds
  eta?: Date; // Estimated time of completion

  // Data metrics
  inputSize?: number; // bytes
  processedSize?: number; // bytes
  totalSize?: number; // bytes
  throughput?: number; // bytes per second

  // Error handling
  error?: ProgressError;
  retryCount?: number;
  maxRetries?: number;
  canRetry?: boolean;
  canCancel?: boolean;

  // UI configuration
  showProgress?: boolean;
  showEta?: boolean;
  showThroughput?: boolean;
  allowCancellation?: boolean;

  // Additional metadata
  metadata?: Record<string, any>;
  tags?: string[];
}

// ============================================================================
// Progress Steps and Stages
// ============================================================================

export interface ProgressStep {
  id: string;
  name: string;
  description?: string;
  status: ProgressStatus;
  progress: number; // 0-100
  duration?: number; // milliseconds
  error?: ProgressError;
  metadata?: Record<string, any>;
}

export interface ProgressStage {
  id: string;
  name: string;
  description?: string;
  steps: ProgressStep[];
  status: ProgressStatus;
  progress: number; // 0-100
  startedAt?: Date;
  completedAt?: Date;
  duration?: number; // milliseconds
}

export interface StackedProgress {
  id: string;
  operation: ProgressOperation;
  stages: ProgressStage[];
  currentStage?: number;
  overallProgress: number; // 0-100
  stageProgress: number; // 0-100 for current stage
}

// ============================================================================
// Error Handling
// ============================================================================

export interface ProgressError {
  code: string;
  message: string;
  details?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  suggestions?: string[];
  timestamp: Date;
}

export interface ProgressRetry {
  attempt: number;
  maxAttempts: number;
  delay: number; // milliseconds
  backoffMultiplier: number;
  lastAttemptAt?: Date;
  nextAttemptAt?: Date;
  reason: string;
}

// ============================================================================
// Progress Configuration
// ============================================================================

export interface ProgressConfig {
  // UI configuration
  style: ProgressStyle;
  size: ProgressSize;
  variant: ProgressVariant;
  showLabel: boolean;
  showPercentage: boolean;
  showSteps: boolean;
  showTime: boolean;
  animate: boolean;

  // Behavior configuration
  updateInterval: number; // milliseconds
  smoothTransitions: boolean;
  autoHide: boolean;
  hideDelay: number; // milliseconds after completion

  // Thresholds
  slowOperationThreshold: number; // milliseconds
  fastOperationThreshold: number; // milliseconds
  etaAccuracyThreshold: number; // percentage

  // Accessibility
  announceProgress: boolean;
  announceInterval: number; // milliseconds
  provideKeyboardNavigation: boolean;

  // Performance
  throttleUpdates: boolean;
  maxUpdateFrequency: number; // updates per second
  batchUpdates: boolean;
  batchSize: number;
}

export interface ToolProgressConfig {
  toolId: string;
  defaultConfig: ProgressConfig;
  operationConfigs: Record<ProgressType, Partial<ProgressConfig>>;
  estimatedDurations: Record<ProgressType, number>;
  progressCalculation: {
    type: 'linear' | 'exponential' | 'logarithmic' | 'custom';
    weights?: Record<string, number>;
    customFormula?: string;
  };
}

// ============================================================================
// Progress Events
// ============================================================================

export interface ProgressEvent {
  type: 'started' | 'progress' | 'step' | 'paused' | 'resumed' | 'completed' | 'failed' | 'cancelled' | 'eta_updated' | 'error';
  operationId: string;
  timestamp: Date;
  data: any;
}

export interface ProgressUpdate {
  operationId: string;
  progress: number;
  message?: string;
  step?: {
    current: number;
    total: number;
    name?: string;
  };
  eta?: Date;
  throughput?: number;
  metadata?: Record<string, any>;
}

// ============================================================================
// Analytics and Metrics
// ============================================================================

export interface ProgressMetrics {
  // Operation metrics
  totalOperations: number;
  activeOperations: number;
  completedOperations: number;
  failedOperations: number;
  cancelledOperations: number;

  // Performance metrics
  averageDuration: number;
  medianDuration: number;
  p95Duration: number;
  p99Duration: number;

  // Accuracy metrics
  etaAccuracy: number; // percentage
  estimationError: number; // average error percentage

  // User experience metrics
  abandonmentRate: number;
  cancellationRate: number;
  retryRate: number;

  // Tool-specific metrics
  toolMetrics: Record<string, {
    operations: number;
    averageDuration: number;
    successRate: number;
    userSatisfaction: number;
  }>;

  // Type-specific metrics
  typeMetrics: Record<ProgressType, {
    operations: number;
    averageDuration: number;
    accuracy: number;
  }>;

  // Time window
  timeWindow: string;
  lastUpdated: Date;
}

export interface ProgressAnalytics {
  // Historical data
  operationHistory: ProgressOperation[];
  completionTimes: Array<{
    toolId: string;
    type: ProgressType;
    duration: number;
    inputSize: number;
    timestamp: Date;
  }>;

  // Patterns and insights
  performancePatterns: {
    peakHours: number[];
    slowOperations: string[];
    frequentErrors: Array<{
      code: string;
      count: number;
      affectedTools: string[];
    }>;
  };

  // Predictions
  durationPredictions: Record<string, {
    toolId: string;
    type: ProgressType;
    estimatedDuration: number;
    confidence: number;
    factors: string[];
  }>;

  // User behavior
  userBehavior: {
    averageWaitTime: number;
    cancellationPoints: Array<{
      operationType: ProgressType;
      averageProgress: number;
      reason: string;
    }>;
    retryPatterns: Record<string, number>;
  };
}

// ============================================================================
// UI Components Props
// ============================================================================

export interface ProgressBarProps {
  operation: ProgressOperation;
  config?: Partial<ProgressConfig>;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export interface CircularProgressProps {
  operation: ProgressOperation;
  config?: Partial<ProgressConfig>;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
  'aria-label'?: string;
}

export interface ProgressStepsProps {
  operation: ProgressOperation;
  steps: ProgressStep[];
  config?: Partial<ProgressConfig>;
  className?: string;
  'aria-label'?: string;
}

export interface ProgressOverlayProps {
  operations: ProgressOperation[];
  config?: Partial<ProgressConfig>;
  visible: boolean;
  closable?: boolean;
  className?: string;
  'aria-label'?: string;
}

export interface ProgressSkeletonProps {
  type: 'text' | 'card' | 'list' | 'table' | 'custom';
  lines?: number;
  className?: string;
  animated?: boolean;
  'aria-label'?: string;
}

// ============================================================================
// State Management
// ============================================================================

export interface ProgressState {
  operations: Record<string, ProgressOperation>;
  activeOperations: string[];
  completedOperations: string[];
  globalConfig: ProgressConfig;
  toolConfigs: Record<string, ToolProgressConfig>;
  analytics: ProgressAnalytics;
  listeners: Record<string, Array<(event: ProgressEvent) => void>>;
}

export interface ProgressActions {
  // Operation management
  startOperation: (operation: Omit<ProgressOperation, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateProgress: (operationId: string, update: ProgressUpdate) => void;
  completeOperation: (operationId: string, result?: any) => void;
  failOperation: (operationId: string, error: ProgressError) => void;
  cancelOperation: (operationId: string, reason?: string) => void;
  pauseOperation: (operationId: string) => void;
  resumeOperation: (operationId: string) => void;

  // Step management
  addStep: (operationId: string, step: Omit<ProgressStep, 'id'>) => string;
  updateStep: (operationId: string, stepId: string, update: Partial<ProgressStep>) => void;
  completeStep: (operationId: string, stepId: string) => void;

  // Configuration
  updateConfig: (config: Partial<ProgressConfig>) => void;
  updateToolConfig: (toolId: string, config: Partial<ToolProgressConfig>) => void;

  // Analytics
  getMetrics: (timeWindow?: string) => ProgressMetrics;
  getAnalytics: () => ProgressAnalytics;

  // Event handling
  addEventListener: (operationId: string, callback: (event: ProgressEvent) => void) => void;
  removeEventListener: (operationId: string, callback: (event: ProgressEvent) => void) => void;

  // Cleanup
  clearCompleted: (olderThan?: Date) => void;
  reset: () => void;
}

// ============================================================================
// Integration Interfaces
// ============================================================================

export interface ProgressIntegration {
  // Error recovery integration
  onError: (operationId: string, error: ProgressError) => void;
  onRetry: (operationId: string, retry: ProgressRetry) => void;

  // Analytics integration
  onComplete: (operationId: string, metrics: any) => void;
  onProgress: (operationId: string, progress: number) => void;

  // Performance monitoring
  onSlowOperation: (operationId: string, threshold: number) => void;
  onUserInteraction: (operationId: string, action: string) => void;
}

// ============================================================================
// Type Guards and Utilities
// ============================================================================

export function isValidProgressStatus(status: string): status is ProgressStatus {
  return ['idle', 'pending', 'running', 'paused', 'completed', 'failed', 'cancelled'].includes(status);
}

export function isValidProgressType(type: string): type is ProgressType {
  return [
    'validation', 'processing', 'conversion', 'upload', 'download',
    'analysis', 'optimization', 'compression', 'execution', 'network',
    'indexing', 'rendering', 'background'
  ].includes(type);
}

export function isActiveOperation(status: ProgressStatus): boolean {
  return ['pending', 'running', 'paused'].includes(status);
}

export function isCompletedOperation(status: ProgressStatus): boolean {
  return ['completed', 'failed', 'cancelled'].includes(status);
}

export function getProgressWeight(operation: ProgressOperation): number {
  // Calculate importance weight for prioritization
  let weight = 1;

  // Priority weight
  const priorityWeights = { low: 0.5, medium: 1, high: 1.5, critical: 2 };
  weight *= priorityWeights[operation.priority];

  // Age weight (newer operations get slightly higher weight)
  const ageMs = Date.now() - operation.createdAt.getTime();
  const ageWeight = Math.max(0.5, 1 - (ageMs / (5 * 60 * 1000))); // Decay over 5 minutes
  weight *= ageWeight;

  // User interaction weight (operations with user interaction get priority)
  if (operation.metadata?.userInteracted) {
    weight *= 1.2;
  }

  return weight;
}

export function estimateProgress(operation: ProgressOperation): number {
  // Advanced progress estimation based on operation type and historical data
  let progress = operation.progress;

  // Consider step progress if available
  if (operation.currentStep !== undefined && operation.totalSteps !== undefined) {
    const stepProgress = (operation.currentStep / operation.totalSteps) * 100;
    progress = Math.max(progress, stepProgress);
  }

  // Consider data processing progress
  if (operation.processedSize !== undefined && operation.totalSize !== undefined) {
    const dataProgress = (operation.processedSize / operation.totalSize) * 100;
    progress = Math.max(progress, dataProgress);
  }

  return Math.min(100, Math.max(0, progress));
}

export function calculateEta(operation: ProgressOperation): Date | null {
  if (!operation.startedAt || operation.progress <= 0) {
    return null;
  }

  const now = new Date();
  const elapsedMs = now.getTime() - operation.startedAt.getTime();

  if (elapsedMs <= 0 || operation.progress >= 100) {
    return null;
  }

  // Simple linear estimation
  const totalEstimatedMs = (elapsedMs / operation.progress) * 100;
  const remainingMs = totalEstimatedMs - elapsedMs;

  return new Date(now.getTime() + remainingMs);
}
