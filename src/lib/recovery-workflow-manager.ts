/**
 * Recovery Workflow State Management
 * Manages the complete state and workflow of error recovery processes
 */

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import type { ErrorInfo, RecoveryStep, RecoveryStrategy, ErrorRecoveryResult } from './error-recovery';
import type { RecoveryProgress, ProgressMetrics } from '@/components/error-recovery/progress-tracker';
import type { CategoryGuidanceTemplate } from '@/components/error-recovery/category-guidance';

export interface RecoveryWorkflowState {
  // Active recovery session
  activeSession: RecoverySession | null;

  // History of recovery sessions
  sessionHistory: RecoverySession[];

  // User preferences and settings
  userPreferences: RecoveryUserPreferences;

  // Analytics and metrics
  analytics: RecoveryAnalytics;

  // Workflow state
  workflowState: RecoveryWorkflowState;

  // Cache and optimization
  cache: RecoveryCache;

  // System state
  systemState: RecoverySystemState;
}

export interface RecoverySession {
  id: string;
  errorId: string;
  error: ErrorInfo;
  strategy: RecoveryStrategy | null;
  category: string | null;
  toolId: string | null;

  // Session lifecycle
  status: 'initializing' | 'active' | 'paused' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;

  // Progress tracking
  progress: RecoveryProgress;
  currentStepIndex: number;
  completedSteps: string[];
  failedSteps: string[];
  skippedSteps: string[];

  // User interactions
  userInteractions: UserInteraction[];
  selectedQuickFixes: string[];
  viewedHelpSections: string[];
  tutorialProgress: TutorialProgress;

  // Results and outcomes
  result?: ErrorRecoveryResult;
  outcome: 'success' | 'partial' | 'failure' | 'abandoned';
  userSatisfaction?: number;

  // Context and metadata
  context: RecoveryContext;
  metadata: SessionMetadata;
}

export interface RecoveryUserPreferences {
  // General preferences
  autoRecovery: boolean;
  showProgress: boolean;
  enableAnimations: boolean;
  enableSound: boolean;
  preferredView: 'overview' | 'guidance' | 'walkthrough' | 'category-help' | 'progress';
  compactMode: boolean;

  // Tutorial and help
  enableTutorials: boolean;
  showHints: boolean;
  showAdvancedOptions: boolean;
  completedTutorials: string[];

  // Notifications
  enableNotifications: boolean;
  notificationLevel: 'minimal' | 'normal' | 'detailed';

  // Performance
  enableRealTimeUpdates: boolean;
  maxHistorySize: number;
  cacheEnabled: boolean;

  // Accessibility
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
}

export interface RecoveryAnalytics {
  // Session analytics
  totalSessions: number;
  successfulSessions: number;
  failedSessions: number;
  abandonedSessions: number;

  // Performance metrics
  averageSessionDuration: number;
  averageRecoveryTime: number;
  successRate: number;
  userSatisfactionAverage: number;

  // Category analytics
  categoryPerformance: Record<string, CategoryPerformance>;

  // Error type analytics
  errorTypePerformance: Record<string, ErrorTypePerformance>;

  // Strategy analytics
  strategyPerformance: Record<string, StrategyPerformance>;

  // User behavior analytics
  userBehaviorMetrics: UserBehaviorMetrics;

  // System performance
  systemPerformance: SystemPerformanceMetrics;
}

export interface CategoryPerformance {
  category: string;
  totalErrors: number;
  successfulRecoveries: number;
  averageTime: number;
  mostCommonError: string;
  mostEffectiveStrategy: string;
}

export interface ErrorTypePerformance {
  errorType: string;
  occurrences: number;
  successfulRecoveries: number;
  averageTime: number;
  commonStrategies: string[];
}

export interface StrategyPerformance {
  strategyId: string;
  usageCount: number;
  successCount: number;
  averageTime: number;
  userSatisfaction: number;
}

export interface UserBehaviorMetrics {
  averageStepsPerSession: number;
  quickFixUsageRate: number;
  tutorialCompletionRate: number;
  helpViewingRate: number;
  retryRate: number;
  skipRate: number;
}

export interface SystemPerformanceMetrics {
  averageResponseTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  errorRate: number;
}

export interface UserInteraction {
  id: string;
  timestamp: Date;
  type: 'start_recovery' | 'complete_step' | 'retry_step' | 'skip_step' | 'view_help' | 'apply_quickfix' | 'pause' | 'resume' | 'cancel';
  stepId?: string;
  data?: any;
  duration?: number;
}

export interface TutorialProgress {
  tutorialId: string;
  started: boolean;
  completed: boolean;
  currentStep: number;
  totalSteps: number;
  startTime?: Date;
  completionTime?: Date;
}

export interface RecoveryContext {
  userAgent: string;
  url: string;
  referrer?: string;
  viewportSize: { width: number; height: number };
  timestamp: Date;
  sessionId: string;
  previousErrors: ErrorInfo[];
  systemInfo: {
    browser: string;
    os: string;
    language: string;
    timezone: string;
  };
}

export interface SessionMetadata {
  version: string;
  buildNumber?: string;
  featureFlags: Record<string, boolean>;
  experimentalFeatures: string[];
  debugMode: boolean;
}

export interface RecoveryCache {
  strategies: Map<string, RecoveryStrategy>;
  categoryGuidance: Map<string, CategoryGuidanceTemplate>;
  quickFixes: Map<string, any>;
  userHistory: Map<string, RecoverySession[]>;
  analytics: RecoveryAnalytics;
  lastUpdated: Date;
}

export interface RecoveryWorkflowActions {
  // Session management
  startSession: (error: ErrorInfo, strategy?: RecoveryStrategy, context?: Partial<RecoveryContext>) => string;
  endSession: (sessionId: string, result?: ErrorRecoveryResult) => void;
  pauseSession: (sessionId: string) => void;
  resumeSession: (sessionId: string) => void;
  cancelSession: (sessionId: string) => void;

  // Step management
  startStep: (sessionId: string, stepId: string) => void;
  completeStep: (sessionId: string, stepId: string, result?: any) => void;
  failStep: (sessionId: string, stepId: string, error?: string) => void;
  retryStep: (sessionId: string, stepId: string) => void;
  skipStep: (sessionId: string, stepId: string) => void;

  // Progress tracking
  updateProgress: (sessionId: string, progress: Partial<RecoveryProgress>) => void;
  getCurrentSession: () => RecoverySession | null;
  getSessionById: (sessionId: string) => RecoverySession | null;

  // User interactions
  recordInteraction: (sessionId: string, interaction: Omit<UserInteraction, 'id' | 'timestamp'>) => void;
  recordQuickFixUsage: (sessionId: string, quickFixId: string) => void;
  recordHelpViewing: (sessionId: string, helpSection: string) => void;

  // Analytics and reporting
  updateAnalytics: () => void;
  generateReport: (sessionId?: string) => RecoveryReport;
  exportHistory: (format: 'json' | 'csv') => string;

  // Preferences management
  updatePreferences: (preferences: Partial<RecoveryUserPreferences>) => void;
  resetPreferences: () => void;

  // Cache management
  clearCache: () => void;
  warmupCache: () => Promise<void>;

  // System management
  initialize: () => void;
  cleanup: () => void;
  healthCheck: () => RecoverySystemHealth;
}

export interface RecoveryReport {
  sessionId?: string;
  generatedAt: Date;
  summary: {
    totalSessions: number;
    successRate: number;
    averageTime: number;
    userSatisfaction: number;
  };
  details: {
    sessions: RecoverySession[];
    categoryBreakdown: Record<string, any>;
    errorBreakdown: Record<string, any>;
    strategyBreakdown: Record<string, any>;
  };
  insights: string[];
  recommendations: string[];
}

export interface RecoverySystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    cache: boolean;
    storage: boolean;
    performance: boolean;
    analytics: boolean;
  };
  metrics: {
    responseTime: number;
    memoryUsage: number;
    errorRate: number;
    uptime: number;
  };
  lastCheck: Date;
}

/**
 * Recovery Workflow Manager Store
 */
export const useRecoveryWorkflowManager = create<RecoveryWorkflowState & RecoveryWorkflowActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        activeSession: null,
        sessionHistory: [],
        userPreferences: {
          autoRecovery: false,
          showProgress: true,
          enableAnimations: true,
          enableSound: false,
          preferredView: 'overview',
          compactMode: false,
          enableTutorials: true,
          showHints: true,
          showAdvancedOptions: false,
          completedTutorials: [],
          enableNotifications: true,
          notificationLevel: 'normal',
          enableRealTimeUpdates: true,
          maxHistorySize: 100,
          cacheEnabled: true,
          highContrast: false,
          reducedMotion: false,
          screenReaderOptimized: false,
        },
        analytics: {
          totalSessions: 0,
          successfulSessions: 0,
          failedSessions: 0,
          abandonedSessions: 0,
          averageSessionDuration: 0,
          averageRecoveryTime: 0,
          successRate: 0,
          userSatisfactionAverage: 0,
          categoryPerformance: {},
          errorTypePerformance: {},
          strategyPerformance: {},
          userBehaviorMetrics: {
            averageStepsPerSession: 0,
            quickFixUsageRate: 0,
            tutorialCompletionRate: 0,
            helpViewingRate: 0,
            retryRate: 0,
            skipRate: 0,
          },
          systemPerformance: {
            averageResponseTime: 0,
            cacheHitRate: 0,
            memoryUsage: 0,
            errorRate: 0,
          },
        },
        workflowState: {
          initialized: false,
          isLoading: false,
          error: null,
        },
        cache: {
          strategies: new Map(),
          categoryGuidance: new Map(),
          quickFixes: new Map(),
          userHistory: new Map(),
          analytics: {} as RecoveryAnalytics,
          lastUpdated: new Date(),
        },

        // Session management actions
        startSession: (error, strategy, context) => {
          const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          const session: RecoverySession = {
            id: sessionId,
            errorId: error.id || `error-${Date.now()}`,
            error,
            strategy,
            category: context?.category || null,
            toolId: context?.toolId || null,
            status: 'initializing',
            startTime: new Date(),
            progress: {
              sessionId,
              errorId: error.id || 'unknown',
              strategy: strategy || {} as RecoveryStrategy,
              steps: strategy?.steps.map(step => ({
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
              })) || [],
              overallStatus: 'pending',
              startTime: new Date(),
              metrics: {
                totalSteps: strategy?.steps.length || 0,
                completedSteps: 0,
                failedSteps: 0,
                skippedSteps: 0,
                inProgressSteps: 0,
                averageStepTime: 0,
                estimatedTimeRemaining: strategy?.steps.reduce((sum, step) => sum + (step.estimatedTime || 30), 0) || 0,
                successRate: 0,
                retryRate: 0,
                efficiency: 0,
                progressPercentage: 0,
              },
              metadata: {
                userId: context?.userId,
                toolId: context?.toolId,
                category: context?.category,
                userAgent: navigator.userAgent,
                sessionId: context?.sessionId || sessionId,
              },
            },
            currentStepIndex: 0,
            completedSteps: [],
            failedSteps: [],
            skippedSteps: [],
            userInteractions: [],
            selectedQuickFixes: [],
            viewedHelpSections: [],
            tutorialProgress: {
              tutorialId: 'default-recovery',
              started: false,
              completed: false,
              currentStep: 0,
              totalSteps: 1,
            },
            outcome: 'abandoned',
            context: {
              userAgent: navigator.userAgent,
              url: window.location.href,
              referrer: document.referrer,
              viewportSize: {
                width: window.innerWidth,
                height: window.innerHeight,
              },
              timestamp: new Date(),
              sessionId,
              previousErrors: get().sessionHistory.slice(-3).map(s => s.error),
              systemInfo: {
                browser: navigator.appName,
                os: navigator.platform,
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
              ...context,
            } as RecoveryContext,
            metadata: {
              version: '1.0.0',
              buildNumber: process.env.NEXT_PUBLIC_BUILD_NUMBER,
              featureFlags: {},
              experimentalFeatures: [],
              debugMode: process.env.NODE_ENV === 'development',
            },
          };

          set(state => ({
            activeSession: session,
            sessionHistory: [...state.sessionHistory.slice(state.userPreferences.maxHistorySize - 1), session],
            workflowState: {
              ...state.workflowState,
              initialized: true,
            },
          }));

          return sessionId;
        },

        endSession: (sessionId, result) => {
          set(state => {
            const sessions = [...state.sessionHistory];
            const sessionIndex = sessions.findIndex(s => s.id === sessionId);

            if (sessionIndex !== -1) {
              const session = sessions[sessionIndex];
              const endTime = new Date();
              const duration = endTime.getTime() - session.startTime.getTime();

              sessions[sessionIndex] = {
                ...session,
                status: result?.success ? 'completed' : 'failed',
                endTime,
                duration,
                result,
                outcome: result?.success ? 'success' : 'failure',
                userSatisfaction: result?.userSatisfaction,
                progress: {
                  ...session.progress,
                  overallStatus: result?.success ? 'completed' : 'failed',
                  endTime,
                  totalDuration: duration,
                },
              };

              return {
                activeSession: sessionId === state.activeSession?.id ? null : state.activeSession,
                sessionHistory: sessions,
              };
            }

            return state;
          });

          get().updateAnalytics();
        },

        pauseSession: (sessionId) => {
          set(state => ({
            activeSession: state.activeSession?.id === sessionId
              ? { ...state.activeSession, status: 'paused' }
              : state.activeSession,
            sessionHistory: state.sessionHistory.map(session =>
              session.id === sessionId ? { ...session, status: 'paused' } : session
            ),
          }));
        },

        resumeSession: (sessionId) => {
          set(state => ({
            activeSession: state.activeSession?.id === sessionId
              ? { ...state.activeSession, status: 'active' }
              : state.activeSession,
            sessionHistory: state.sessionHistory.map(session =>
              session.id === sessionId ? { ...session, status: 'active' } : session
            ),
          }));
        },

        cancelSession: (sessionId) => {
          set(state => ({
            activeSession: sessionId === state.activeSession?.id ? null : state.activeSession,
            sessionHistory: state.sessionHistory.map(session =>
              session.id === sessionId
                ? {
                    ...session,
                    status: 'cancelled',
                    endTime: new Date(),
                    outcome: 'abandoned',
                    duration: new Date().getTime() - session.startTime.getTime(),
                  }
                : session
            ),
          }));

          get().updateAnalytics();
        },

        // Step management actions
        startStep: (sessionId, stepId) => {
          set(state => {
            const sessions = [...state.sessionHistory];
            const sessionIndex = sessions.findIndex(s => s.id === sessionId);

            if (sessionIndex !== -1) {
              const session = sessions[sessionIndex];
              const stepIndex = session.progress.steps.findIndex(s => s.id === stepId);

              if (stepIndex !== -1) {
                sessions[sessionIndex] = {
                  ...session,
                  progress: {
                    ...session.progress,
                    steps: session.progress.steps.map((step, index) =>
                      index === stepIndex
                        ? { ...step, status: 'in_progress', startTime: new Date() }
                        : step
                    ),
                  },
                };
              }
            }

            return {
              activeSession: sessionId === state.activeSession?.id
                ? sessions.find(s => s.id === sessionId) || state.activeSession
                : state.activeSession,
              sessionHistory: sessions,
            };
          });
        },

        completeStep: (sessionId, stepId, result) => {
          set(state => {
            const sessions = [...state.sessionHistory];
            const sessionIndex = sessions.findIndex(s => s.id === sessionId);

            if (sessionIndex !== -1) {
              const session = sessions[sessionIndex];
              const stepIndex = session.progress.steps.findIndex(s => s.id === stepId);

              if (stepIndex !== -1) {
                const step = session.progress.steps[stepIndex];
                const endTime = new Date();
                const duration = step.startTime ? endTime.getTime() - step.startTime.getTime() : 0;

                sessions[sessionIndex] = {
                  ...session,
                  progress: {
                    ...session.progress,
                    steps: session.progress.steps.map((step, index) =>
                      index === stepIndex
                        ? { ...step, status: 'completed', endTime, duration, result }
                        : step
                    ),
                  },
                  currentStepIndex: session.currentStepIndex + 1,
                  completedSteps: [...session.completedSteps, stepId],
                };
              }
            }

            return {
              activeSession: sessionId === state.activeSession?.id
                ? sessions.find(s => s.id === sessionId) || state.activeSession
                : state.activeSession,
              sessionHistory: sessions,
            };
          });
        },

        failStep: (sessionId, stepId, error) => {
          set(state => {
            const sessions = [...state.sessionHistory];
            const sessionIndex = sessions.findIndex(s => s.id === sessionId);

            if (sessionIndex !== -1) {
              const session = sessions[sessionIndex];
              const stepIndex = session.progress.steps.findIndex(s => s.id === stepId);

              if (stepIndex !== -1) {
                const step = session.progress.steps[stepIndex];
                const endTime = new Date();
                const duration = step.startTime ? endTime.getTime() - step.startTime.getTime() : 0;

                sessions[sessionIndex] = {
                  ...session,
                  progress: {
                    ...session.progress,
                    steps: session.progress.steps.map((step, index) =>
                      index === stepIndex
                        ? { ...step, status: 'failed', endTime, duration, error }
                        : step
                    ),
                  },
                  failedSteps: [...session.failedSteps, stepId],
                };
              }
            }

            return {
              activeSession: sessionId === state.activeSession?.id
                ? sessions.find(s => s.id === sessionId) || state.activeSession
                : state.activeSession,
              sessionHistory: sessions,
            };
          });
        },

        retryStep: (sessionId, stepId) => {
          get().recordInteraction(sessionId, {
            type: 'retry_step',
            stepId,
          });

          // Reset step and start again
          get().startStep(sessionId, stepId);
        },

        skipStep: (sessionId, stepId) => {
          set(state => {
            const sessions = [...state.sessionHistory];
            const sessionIndex = sessions.findIndex(s => s.id === sessionId);

            if (sessionIndex !== -1) {
              const session = sessions[sessionIndex];
              const stepIndex = session.progress.steps.findIndex(s => s.id === stepId);

              if (stepIndex !== -1) {
                sessions[sessionIndex] = {
                  ...session,
                  progress: {
                    ...session.progress,
                    steps: session.progress.steps.map((step, index) =>
                      index === stepIndex
                        ? { ...step, status: 'skipped', endTime: new Date() }
                        : step
                    ),
                  },
                  currentStepIndex: session.currentStepIndex + 1,
                  skippedSteps: [...session.skippedSteps, stepId],
                };
              }
            }

            return {
              activeSession: sessionId === state.activeSession?.id
                ? sessions.find(s => s.id === sessionId) || state.activeSession
                : state.activeSession,
              sessionHistory: sessions,
            };
          });

          get().recordInteraction(sessionId, {
            type: 'skip_step',
            stepId,
          });
        },

        // Progress tracking
        updateProgress: (sessionId, progressUpdate) => {
          set(state => ({
            activeSession: state.activeSession?.id === sessionId
              ? { ...state.activeSession, progress: { ...state.activeSession.progress, ...progressUpdate } }
              : state.activeSession,
            sessionHistory: state.sessionHistory.map(session =>
              session.id === sessionId
                ? { ...session, progress: { ...session.progress, ...progressUpdate } }
                : session
            ),
          }));
        },

        getCurrentSession: () => get().activeSession,
        getSessionById: (sessionId) => get().sessionHistory.find(s => s.id === sessionId) || null,

        // User interactions
        recordInteraction: (sessionId, interaction) => {
          set(state => {
            const fullInteraction: UserInteraction = {
              id: `interaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              timestamp: new Date(),
              ...interaction,
            };

            return {
              activeSession: state.activeSession?.id === sessionId
                ? {
                    ...state.activeSession,
                    userInteractions: [...state.activeSession.userInteractions, fullInteraction],
                  }
                : state.activeSession,
              sessionHistory: state.sessionHistory.map(session =>
                session.id === sessionId
                  ? { ...session, userInteractions: [...session.userInteractions, fullInteraction] }
                  : session
              ),
            };
          });
        },

        recordQuickFixUsage: (sessionId, quickFixId) => {
          set(state => ({
            activeSession: state.activeSession?.id === sessionId
              ? { ...state.activeSession, selectedQuickFixes: [...state.activeSession.selectedQuickFixes, quickFixId] }
              : state.activeSession,
            sessionHistory: state.sessionHistory.map(session =>
              session.id === sessionId
                ? { ...session, selectedQuickFixes: [...session.selectedQuickFixes, quickFixId] }
                : session
            ),
          }));

          get().recordInteraction(sessionId, {
            type: 'apply_quickfix',
            data: { quickFixId },
          });
        },

        recordHelpViewing: (sessionId, helpSection) => {
          set(state => ({
            activeSession: state.activeSession?.id === sessionId
              ? { ...state.activeSession, viewedHelpSections: [...state.activeSession.viewedHelpSections, helpSection] }
              : state.activeSession,
            sessionHistory: state.sessionHistory.map(session =>
              session.id === sessionId
                ? { ...session, viewedHelpSections: [...session.viewedHelpSections, helpSection] }
                : session
            ),
          }));

          get().recordInteraction(sessionId, {
            type: 'view_help',
            data: { helpSection },
          });
        },

        // Analytics and reporting
        updateAnalytics: () => {
          const state = get();
          const sessions = state.sessionHistory;

          const completedSessions = sessions.filter(s => s.status === 'completed');
          const successfulSessions = completedSessions.filter(s => s.outcome === 'success');
          const failedSessions = sessions.filter(s => s.status === 'failed');
          const abandonedSessions = sessions.filter(s => s.status === 'cancelled');

          const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
          const averageSessionDuration = sessions.length > 0 ? totalDuration / sessions.length : 0;

          const recoveryTimes = completedSessions.map(s => s.duration || 0);
          const averageRecoveryTime = recoveryTimes.length > 0
            ? recoveryTimes.reduce((sum, time) => sum + time, 0) / recoveryTimes.length
            : 0;

          const successRate = sessions.length > 0 ? (successfulSessions.length / sessions.length) * 100 : 0;

          const userSatisfactionScores = sessions
            .filter(s => s.userSatisfaction !== undefined)
            .map(s => s.userSatisfaction!);
          const userSatisfactionAverage = userSatisfactionScores.length > 0
            ? userSatisfactionScores.reduce((sum, score) => sum + score, 0) / userSatisfactionScores.length
            : 0;

          // Calculate category performance
          const categoryPerformance: Record<string, CategoryPerformance> = {};
          sessions.forEach(session => {
            if (session.category) {
              if (!categoryPerformance[session.category]) {
                categoryPerformance[session.category] = {
                  category: session.category,
                  totalErrors: 0,
                  successfulRecoveries: 0,
                  averageTime: 0,
                  mostCommonError: '',
                  mostEffectiveStrategy: '',
                };
              }

              categoryPerformance[session.category].totalErrors++;
              if (session.outcome === 'success') {
                categoryPerformance[session.category].successfulRecoveries++;
              }
            }
          });

          // Calculate user behavior metrics
          const totalInteractions = sessions.reduce((sum, s) => sum + s.userInteractions.length, 0);
          const quickFixUsages = sessions.reduce((sum, s) => sum + s.selectedQuickFixes.length, 0);
          const helpViewings = sessions.reduce((sum, s) => sum + s.viewedHelpSections.length, 0);
          const retries = sessions.reduce((sum, s) =>
            sum + s.userInteractions.filter(i => i.type === 'retry_step').length, 0
          );
          const skips = sessions.reduce((sum, s) =>
            sum + s.userInteractions.filter(i => i.type === 'skip_step').length, 0
          );

          const updatedAnalytics: RecoveryAnalytics = {
            totalSessions: sessions.length,
            successfulSessions: successfulSessions.length,
            failedSessions: failedSessions.length,
            abandonedSessions: abandonedSessions.length,
            averageSessionDuration,
            averageRecoveryTime,
            successRate,
            userSatisfactionAverage,
            categoryPerformance,
            errorTypePerformance: {},
            strategyPerformance: {},
            userBehaviorMetrics: {
              averageStepsPerSession: sessions.length > 0
                ? sessions.reduce((sum, s) => sum + s.completedSteps.length, 0) / sessions.length
                : 0,
              quickFixUsageRate: sessions.length > 0 ? (quickFixUsages / sessions.length) : 0,
              tutorialCompletionRate: 0, // TODO: Calculate from tutorial progress
              helpViewingRate: sessions.length > 0 ? (helpViewings / sessions.length) : 0,
              retryRate: totalInteractions > 0 ? (retries / totalInteractions) : 0,
              skipRate: totalInteractions > 0 ? (skips / totalInteractions) : 0,
            },
            systemPerformance: {
              averageResponseTime: 0, // TODO: Implement performance monitoring
              cacheHitRate: 0, // TODO: Implement cache monitoring
              memoryUsage: 0, // TODO: Implement memory monitoring
              errorRate: 0, // TODO: Implement error rate monitoring
            },
          };

          set({ analytics: updatedAnalytics });
        },

        generateReport: (sessionId) => {
          const state = get();
          const targetSessions = sessionId
            ? state.sessionHistory.filter(s => s.id === sessionId)
            : state.sessionHistory;

          const report: RecoveryReport = {
            sessionId,
            generatedAt: new Date(),
            summary: {
              totalSessions: targetSessions.length,
              successRate: state.analytics.successRate,
              averageTime: state.analytics.averageRecoveryTime,
              userSatisfaction: state.analytics.userSatisfactionAverage,
            },
            details: {
              sessions: targetSessions,
              categoryBreakdown: state.analytics.categoryPerformance,
              errorBreakdown: state.analytics.errorTypePerformance,
              strategyBreakdown: state.analytics.strategyPerformance,
            },
            insights: [],
            recommendations: [],
          };

          // Generate insights
          if (state.analytics.successRate > 80) {
            report.insights.push('High recovery success rate indicates effective error handling');
          }

          if (state.analytics.userSatisfactionAverage > 4) {
            report.insights.push('High user satisfaction with the recovery process');
          }

          // Generate recommendations
          if (state.analytics.successRate < 60) {
            report.recommendations.push('Consider reviewing and improving recovery strategies');
          }

          if (state.analytics.userBehaviorMetrics.helpViewingRate > 0.8) {
            report.recommendations.push('Users frequently need help - consider improving error messages');
          }

          return report;
        },

        exportHistory: (format) => {
          const state = get();
          const data = {
            sessions: state.sessionHistory,
            analytics: state.analytics,
            preferences: state.userPreferences,
            exportedAt: new Date(),
          };

          if (format === 'json') {
            return JSON.stringify(data, null, 2);
          } else if (format === 'csv') {
            // Convert to CSV format
            const headers = ['Session ID', 'Error Type', 'Category', 'Status', 'Duration', 'Outcome'];
            const rows = state.sessionHistory.map(session => [
              session.id,
              session.error.type,
              session.category || 'Unknown',
              session.status,
              session.duration?.toString() || '0',
              session.outcome,
            ]);

            return [headers, ...rows].map(row => row.join(',')).join('\n');
          }

          return '';
        },

        // Preferences management
        updatePreferences: (preferences) => {
          set(state => ({
            userPreferences: { ...state.userPreferences, ...preferences },
          }));
        },

        resetPreferences: () => {
          set({
            userPreferences: {
              autoRecovery: false,
              showProgress: true,
              enableAnimations: true,
              enableSound: false,
              preferredView: 'overview',
              compactMode: false,
              enableTutorials: true,
              showHints: true,
              showAdvancedOptions: false,
              completedTutorials: [],
              enableNotifications: true,
              notificationLevel: 'normal',
              enableRealTimeUpdates: true,
              maxHistorySize: 100,
              cacheEnabled: true,
              highContrast: false,
              reducedMotion: false,
              screenReaderOptimized: false,
            },
          });
        },

        // Cache management
        clearCache: () => {
          set({
            cache: {
              strategies: new Map(),
              categoryGuidance: new Map(),
              quickFixes: new Map(),
              userHistory: new Map(),
              analytics: {} as RecoveryAnalytics,
              lastUpdated: new Date(),
            },
          });
        },

        warmupCache: async () => {
          // TODO: Implement cache warming logic
          console.log('Warming up cache...');
        },

        // System management
        initialize: () => {
          set(state => ({
            workflowState: {
              ...state.workflowState,
              initialized: true,
              isLoading: false,
            },
          }));

          // Update analytics on initialization
          get().updateAnalytics();
        },

        cleanup: () => {
          // Clear active session
          set({ activeSession: null });

          // Update analytics
          get().updateAnalytics();

          // Cleanup old sessions based on preferences
          const maxHistorySize = get().userPreferences.maxHistorySize;
          set(state => ({
            sessionHistory: state.sessionHistory.slice(-maxHistorySize),
          }));
        },

        healthCheck: (): RecoverySystemHealth => {
          const state = get();

          return {
            status: 'healthy', // TODO: Implement actual health checking
            checks: {
              cache: true,
              storage: true,
              performance: true,
              analytics: true,
            },
            metrics: {
              responseTime: 100,
              memoryUsage: 1024 * 1024, // 1MB
              errorRate: 0.01,
              uptime: Date.now() - (state.workflowState.initialized ? Date.now() : 0),
            },
            lastCheck: new Date(),
          };
        },
      }),
      {
        name: 'recovery-workflow-storage',
        version: 1,
        partialize: (state) => ({
          userPreferences: state.userPreferences,
          sessionHistory: state.sessionHistory.slice(-50), // Only persist last 50 sessions
          analytics: state.analytics,
        }),
      }
    )
  )
);

/**
 * Hook for easy access to recovery workflow manager
 */
export function useRecoveryWorkflow() {
  return useRecoveryWorkflowManager();
}

/**
 * Hook for session-specific operations
 */
export function useRecoverySession(sessionId?: string) {
  const workflow = useRecoveryWorkflowManager();
  const session = sessionId
    ? workflow.getSessionById(sessionId)
    : workflow.getCurrentSession();

  return {
    session,
    isActive: !!session && session.status === 'active',
    isCompleted: !!session && session.status === 'completed',
    progress: session?.progress,

    // Session actions
    startStep: (stepId: string) => sessionId && workflow.startStep(sessionId, stepId),
    completeStep: (stepId: string, result?: any) => sessionId && workflow.completeStep(sessionId, stepId, result),
    failStep: (stepId: string, error?: string) => sessionId && workflow.failStep(sessionId, stepId, error),
    retryStep: (stepId: string) => sessionId && workflow.retryStep(sessionId, stepId),
    skipStep: (stepId: string) => sessionId && workflow.skipStep(sessionId, stepId),

    // Interaction recording
    recordInteraction: (interaction: Omit<UserInteraction, 'id' | 'timestamp'>) =>
      sessionId && workflow.recordInteraction(sessionId, interaction),
    recordQuickFixUsage: (quickFixId: string) => sessionId && workflow.recordQuickFixUsage(sessionId, quickFixId),
    recordHelpViewing: (helpSection: string) => sessionId && workflow.recordHelpViewing(sessionId, helpSection),
  };
}

export default {
  useRecoveryWorkflowManager,
  useRecoveryWorkflow,
  useRecoverySession,
};
