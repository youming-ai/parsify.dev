/**
 * Feedback Collection System State Management with Zustand
 * Manages feedback collection, display, user preferences, and analytics
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  FeedbackSubmission,
  FeedbackConfig,
  UserFeedbackPreferences,
  FeedbackTemplate,
  FeedbackAnalytics,
  FeedbackTriggerConfig,
  UserJourneyStage,
  FeedbackType,
  FeedbackStatus,
  FeedbackPriority,
  AlertSeverity
} from '@/types/feedback';

// ============================================================================
// Store Interfaces
// ============================================================================

interface FeedbackState {
  // Configuration
  config: FeedbackConfig;

  // User preferences and state
  userPreferences: UserFeedbackPreferences;
  sessionId: string;
  currentJourneyStage: UserJourneyStage;

  // Collection state
  activeTriggers: FeedbackTriggerConfig[];
  pendingRequests: FeedbackTriggerConfig[];
  dismissedRequests: string[];
  lastShownTime?: Date;

  // UI state
  isModalOpen: boolean;
  currentTemplate?: FeedbackTemplate;
  currentStep: number;
  formData: Record<string, any>;
  isSubmitting: boolean;

  // Submissions
  submissions: FeedbackSubmission[];
  currentSubmission?: Partial<FeedbackSubmission>;

  // Analytics
  analytics?: FeedbackAnalytics;
  isAnalyzing: boolean;

  // Tracking
  sessionMetrics: SessionMetrics;
}

interface SessionMetrics {
  sessionStartTime: Date;
  totalInteractions: number;
  toolsUsed: string[];
  errorsEncountered: number;
  timeInCurrentTool: number;
  pagesViewed: string[];
  lastActivity: Date;
}

interface FeedbackActions {
  // Configuration
  setConfig: (config: Partial<FeedbackConfig>) => void;
  updateConfig: (updates: Partial<FeedbackConfig>) => void;

  // User preferences
  setUserPreferences: (preferences: Partial<UserFeedbackPreferences>) => void;
  updatePreference: (key: keyof UserFeedbackPreferences, value: any) => void;
  optOut: () => void;
  optIn: () => void;

  // Session management
  startSession: (sessionId: string) => void;
  endSession: () => void;
  updateJourneyStage: (stage: UserJourneyStage) => void;
  trackInteraction: (type: string, details?: Record<string, any>) => void;
  trackToolUsage: (toolId: string) => void;
  trackError: (error: Error, context?: Record<string, any>) => void;

  // Trigger management
  addTrigger: (trigger: FeedbackTriggerConfig) => void;
  removeTrigger: (triggerId: string) => void;
  updateTrigger: (triggerId: string, updates: Partial<FeedbackTriggerConfig>) => void;
  evaluateTriggers: () => FeedbackTriggerConfig[];

  // Modal and form management
  openFeedbackModal: (template: FeedbackTemplate, triggerId?: string) => void;
  closeFeedbackModal: () => void;
  nextStep: () => void;
  previousStep: () => void;
  setFormData: (data: Record<string, any>) => void;
  updateFormData: (field: string, value: any) => void;

  // Submission
  submitFeedback: () => Promise<void>;
  discardFeedback: () => void;
  saveDraft: () => void;

  // Requests management
  dismissRequest: (requestId: string) => void;
  shouldShowRequest: (trigger: FeedbackTriggerConfig) => boolean;

  // Analytics
  refreshAnalytics: () => Promise<void>;
  analyzeSentiment: (text: string) => Promise<void>;

  // Reset
  reset: () => void;
  resetSession: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

const defaultConfig: FeedbackConfig = {
  enabled: true,
  collection: {
    autoTrigger: true,
    contextualRequests: true,
    toolSpecificSurveys: true,
    bugReports: true,
    featureRequests: true,
    satisfactionSurveys: true,
    npsSurveys: false, // Less frequent
  },
  frequency: {
    maxRequestsPerSession: 3,
    minIntervalBetweenRequests: 10, // 10 minutes
    cooldownPeriod: 24, // 24 hours
    respectUserPreferences: true,
  },
  display: {
    position: 'bottom-right',
    style: 'modal',
    animation: 'slide',
    delay: 2, // 2 seconds
    autoHide: 0, // No auto-hide
  },
  privacy: {
    anonymizeData: false,
    collectUserAgent: true,
    collectSessionData: true,
    requireConsent: false,
    dataRetention: 365, // 1 year
  },
  integration: {
    analytics: true,
    errorHandling: true,
    monitoring: true,
    crm: false,
    projectManagement: false,
  },
};

const defaultUserPreferences: UserFeedbackPreferences = {
  enabled: true,
  frequency: 'moderate',
  channels: ['modal', 'inline'],
  timing: ['after_tool_use', 'on_error'],
  topics: ['satisfaction', 'usability', 'bug_report'],
  lastInteraction: new Date(),
  totalGiven: 0,
  optedOut: false,
  customSettings: {
    toolSpecificSettings: {},
  },
};

export const useFeedbackStore = create<FeedbackState & FeedbackActions>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        config: defaultConfig,
        userPreferences: defaultUserPreferences,
        sessionId: '',
        currentJourneyStage: 'discovery',

        activeTriggers: [],
        pendingRequests: [],
        dismissedRequests: [],
        lastShownTime: undefined,

        isModalOpen: false,
        currentTemplate: undefined,
        currentStep: 0,
        formData: {},
        isSubmitting: false,

        submissions: [],
        currentSubmission: undefined,

        analytics: undefined,
        isAnalyzing: false,

        sessionMetrics: {
          sessionStartTime: new Date(),
          totalInteractions: 0,
          toolsUsed: [],
          errorsEncountered: 0,
          timeInCurrentTool: 0,
          pagesViewed: [],
          lastActivity: new Date(),
        },

        // Configuration actions
        setConfig: (config) => set({ config: { ...get().config, ...config } }),

        updateConfig: (updates) => set((state) => ({
          config: { ...state.config, ...updates }
        })),

        // User preferences actions
        setUserPreferences: (preferences) => set((state) => ({
          userPreferences: { ...state.userPreferences, ...preferences }
        })),

        updatePreference: (key, value) => set((state) => ({
          userPreferences: { ...state.userPreferences, [key]: value }
        })),

        optOut: () => set((state) => ({
          userPreferences: { ...state.userPreferences, optedOut: true, enabled: false }
        })),

        optIn: () => set((state) => ({
          userPreferences: { ...state.userPreferences, optedOut: false, enabled: true }
        })),

        // Session management actions
        startSession: (sessionId) => set({
          sessionId,
          sessionMetrics: {
            sessionStartTime: new Date(),
            totalInteractions: 0,
            toolsUsed: [],
            errorsEncountered: 0,
            timeInCurrentTool: 0,
            pagesViewed: [],
            lastActivity: new Date(),
          }
        }),

        endSession: () => set((state) => ({
          sessionId: '',
          sessionMetrics: {
            ...state.sessionMetrics,
            sessionEndTime: new Date(),
          }
        })),

        updateJourneyStage: (stage) => set({ currentJourneyStage: stage }),

        trackInteraction: (type, details) => set((state) => ({
          sessionMetrics: {
            ...state.sessionMetrics,
            totalInteractions: state.sessionMetrics.totalInteractions + 1,
            lastActivity: new Date(),
          }
        })),

        trackToolUsage: (toolId) => set((state) => ({
          sessionMetrics: {
            ...state.sessionMetrics,
            toolsUsed: state.sessionMetrics.toolsUsed.includes(toolId)
              ? state.sessionMetrics.toolsUsed
              : [...state.sessionMetrics.toolsUsed, toolId],
            lastActivity: new Date(),
          }
        })),

        trackError: (error, context) => set((state) => ({
          sessionMetrics: {
            ...state.sessionMetrics,
            errorsEncountered: state.sessionMetrics.errorsEncountered + 1,
            lastActivity: new Date(),
          }
        })),

        // Trigger management actions
        addTrigger: (trigger) => set((state) => ({
          activeTriggers: [...state.activeTriggers, trigger]
        })),

        removeTrigger: (triggerId) => set((state) => ({
          activeTriggers: state.activeTriggers.filter(t => t.id !== triggerId)
        })),

        updateTrigger: (triggerId, updates) => set((state) => ({
          activeTriggers: state.activeTriggers.map(trigger =>
            trigger.id === triggerId ? { ...trigger, ...updates } : trigger
          )
        })),

        evaluateTriggers: () => {
          const state = get();
          const { config, userPreferences, sessionMetrics, lastShownTime, dismissedRequests } = state;
          const { activeTriggers } = state;

          if (!config.enabled || !userPreferences.enabled || userPreferences.optedOut) {
            return [];
          }

          // Check frequency limits
          const now = new Date();
          const timeSinceLastShown = lastShownTime
            ? now.getTime() - lastShownTime.getTime()
            : Infinity;
          const minIntervalMs = config.frequency.minIntervalBetweenRequests * 60 * 1000;

          if (timeSinceLastShown < minIntervalMs) {
            return [];
          }

          // Check session limits
          if (state.submissions.length >= config.frequency.maxRequestsPerSession) {
            return [];
          }

          // Evaluate each trigger
          return activeTriggers.filter(trigger => {
            if (!trigger.enabled) return false;
            if (dismissedRequests.includes(trigger.id)) return false;

            // Check cooldown period
            const cooldownMs = trigger.cooldown * 60 * 1000;
            if (timeSinceLastShown < cooldownMs) return false;

            // Check probability
            if (Math.random() > trigger.probability) return false;

            // Evaluate trigger conditions
            return evaluateTriggerConditions(trigger.conditions, state);
          });
        },

        // Modal and form management actions
        openFeedbackModal: (template, triggerId) => set((state) => ({
          isModalOpen: true,
          currentTemplate: template,
          currentStep: 0,
          formData: {},
          currentSubmission: {
            type: template.type,
            timestamp: new Date(),
            sessionId: state.sessionId,
            context: {
              page: window.location.pathname,
              userAgent: navigator.userAgent,
              viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
              },
              sessionDuration: Date.now() - state.sessionMetrics.sessionStartTime.getTime(),
              userJourneyStage: state.currentJourneyStage,
            },
          }
        })),

        closeFeedbackModal: () => set({
          isModalOpen: false,
          currentTemplate: undefined,
          currentStep: 0,
          formData: {},
          currentSubmission: undefined,
        }),

        nextStep: () => set((state) => ({
          currentStep: Math.min(
            state.currentStep + 1,
            (state.currentTemplate?.layout.sections.length || 1) - 1
          )
        })),

        previousStep: () => set((state) => ({
          currentStep: Math.max(0, state.currentStep - 1)
        })),

        setFormData: (data) => set({ formData: data }),

        updateFormData: (field, value) => set((state) => ({
          formData: { ...state.formData, [field]: value }
        })),

        // Submission actions
        submitFeedback: async () => {
          const state = get();
          if (!state.currentSubmission || !state.currentTemplate) return;

          set({ isSubmitting: true });

          try {
            const submission: FeedbackSubmission = {
              ...state.currentSubmission,
              id: generateId(),
              content: mapFormDataToContent(state.formData, state.currentTemplate),
              metadata: {
                ...state.currentSubmission.metadata,
                totalTimeOnPage: Date.now() - state.sessionMetrics.sessionStartTime.getTime(),
                formTime: Date.now() - (state.currentSubmission.timestamp?.getTime() || Date.now()),
              },
              status: 'new',
              priority: 'medium',
            } as FeedbackSubmission;

            // Store submission
            set((state) => ({
              submissions: [...state.submissions, submission],
              isSubmitting: false,
              isModalOpen: false,
              lastShownTime: new Date(),
            }));

            // Update user preferences
            set((state) => ({
              userPreferences: {
                ...state.userPreferences,
                lastInteraction: new Date(),
                totalGiven: state.userPreferences.totalGiven + 1,
              }
            }));

            // Integrate with monitoring systems
            if (state.config.integration.analytics) {
              await sendToAnalytics('feedback_submitted', submission);
            }

            if (state.config.integration.errorHandling && submission.type === 'bug_report') {
              await sendToErrorHandling(submission);
            }

          } catch (error) {
            console.error('Failed to submit feedback:', error);
            set({ isSubmitting: false });
          }
        },

        discardFeedback: () => set({
          isModalOpen: false,
          currentTemplate: undefined,
          currentStep: 0,
          formData: {},
          currentSubmission: undefined,
        }),

        saveDraft: () => {
          const state = get();
          if (!state.currentSubmission) return;

          // Save draft to local storage for later completion
          const draft = {
            ...state.currentSubmission,
            formData: state.formData,
            savedAt: new Date(),
          };

          localStorage.setItem(`feedback-draft-${state.sessionId}`, JSON.stringify(draft));
        },

        // Requests management actions
        dismissRequest: (requestId) => set((state) => ({
          dismissedRequests: [...state.dismissedRequests, requestId],
          pendingRequests: state.pendingRequests.filter(r => r.id !== requestId),
        })),

        shouldShowRequest: (trigger) => {
          const state = get();
          const { config, userPreferences, dismissedRequests } = state;

          if (!config.enabled || !userPreferences.enabled || userPreferences.optedOut) {
            return false;
          }

          if (dismissedRequests.includes(trigger.id)) {
            return false;
          }

          return evaluateTriggerConditions(trigger.conditions, state);
        },

        // Analytics actions
        refreshAnalytics: async () => {
          set({ isAnalyzing: true });

          try {
            // In a real implementation, this would fetch from an analytics service
            const analytics = await generateAnalytics(get().submissions);
            set({ analytics, isAnalyzing: false });
          } catch (error) {
            console.error('Failed to refresh analytics:', error);
            set({ isAnalyzing: false });
          }
        },

        analyzeSentiment: async (text) => {
          try {
            // In a real implementation, this would call a sentiment analysis service
            const sentiment = await analyzeSentiment(text);
            return sentiment;
          } catch (error) {
            console.error('Failed to analyze sentiment:', error);
            return null;
          }
        },

        // Reset actions
        reset: () => set({
          config: defaultConfig,
          userPreferences: defaultUserPreferences,
          activeTriggers: [],
          pendingRequests: [],
          dismissedRequests: [],
          lastShownTime: undefined,
          isModalOpen: false,
          currentTemplate: undefined,
          currentStep: 0,
          formData: {},
          isSubmitting: false,
          submissions: [],
          currentSubmission: undefined,
          analytics: undefined,
          isAnalyzing: false,
          sessionMetrics: {
            sessionStartTime: new Date(),
            totalInteractions: 0,
            toolsUsed: [],
            errorsEncountered: 0,
            timeInCurrentTool: 0,
            pagesViewed: [],
            lastActivity: new Date(),
          },
        }),

        resetSession: () => set({
          sessionId: '',
          currentJourneyStage: 'discovery',
          sessionMetrics: {
            sessionStartTime: new Date(),
            totalInteractions: 0,
            toolsUsed: [],
            errorsEncountered: 0,
            timeInCurrentTool: 0,
            pagesViewed: [],
            lastActivity: new Date(),
          },
        }),
      }),
      {
        name: 'feedback-store',
        partialize: (state) => ({
          config: state.config,
          userPreferences: state.userPreferences,
          submissions: state.submissions,
        }),
      }
    ),
    {
      name: 'feedback-store',
    }
  )
);

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function evaluateTriggerConditions(
  conditions: any[],
  state: FeedbackState
): boolean {
  // Simplified condition evaluation
  // In a real implementation, this would be more sophisticated

  for (const condition of conditions) {
    const { field, operator, value, required } = condition;

    switch (field) {
      case 'sessionDuration':
        const sessionDuration = Date.now() - state.sessionMetrics.sessionStartTime.getTime();
        if (operator === 'greater_than' && sessionDuration < value * 60 * 1000) {
          return false;
        }
        break;

      case 'toolsUsed':
        if (operator === 'contains' && !state.sessionMetrics.toolsUsed.includes(value)) {
          return false;
        }
        break;

      case 'errorsEncountered':
        if (operator === 'greater_than' && state.sessionMetrics.errorsEncountered < value) {
          return false;
        }
        break;

      case 'journeyStage':
        if (operator === 'equals' && state.currentJourneyStage !== value) {
          return false;
        }
        break;

      case 'totalInteractions':
        if (operator === 'greater_than' && state.sessionMetrics.totalInteractions < value) {
          return false;
        }
        break;

      default:
        if (required) return false;
    }
  }

  return true;
}

function mapFormDataToContent(
  formData: Record<string, any>,
  template: FeedbackTemplate
): any {
  // Map form data to the appropriate content structure based on template type
  switch (template.type) {
    case 'rating':
      return {
        rating: {
          score: formData.rating || 0,
          maxScore: formData.maxScore || 5,
          comment: formData.comment,
        }
      };

    case 'survey':
      return {
        survey: {
          answers: template.questions.map(q => ({
            questionId: q.id,
            question: q.text,
            type: q.type,
            answer: formData[q.id],
            optional: q.optional,
            order: q.order,
          })),
          completionRate: calculateCompletionRate(formData, template.questions),
          timeSpent: formData.timeSpent || 0,
        }
      };

    case 'bug_report':
      return {
        bugReport: {
          title: formData.title,
          description: formData.description,
          severity: formData.severity,
          reproducibility: formData.reproducibility,
          steps: formData.steps || [],
          expectedBehavior: formData.expectedBehavior,
          actualBehavior: formData.actualBehavior,
        }
      };

    case 'feature_request':
      return {
        featureRequest: {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          useCase: formData.useCase,
        }
      };

    case 'satisfaction':
      return {
        satisfaction: {
          overall: formData.overall,
          easeOfUse: formData.easeOfUse,
          functionality: formData.functionality,
          performance: formData.performance,
          reliability: formData.reliability,
          likelihoodToRecommend: formData.likelihoodToRecommend,
          comments: formData.comments,
        }
      };

    case 'nps':
      return {
        nps: {
          score: formData.score,
          category: calculateNPSCategory(formData.score),
          reason: formData.reason,
        }
      };

    default:
      return {
        general: {
          category: formData.category,
          subject: formData.subject,
          message: formData.message,
        }
      };
  }
}

function calculateCompletionRate(
  formData: Record<string, any>,
  questions: any[]
): number {
  const requiredQuestions = questions.filter(q => q.required).length;
  const answeredQuestions = questions.filter(q => {
    const value = formData[q.id];
    return value !== undefined && value !== null && value !== '';
  }).length;

  return questions.length > 0 ? (answeredQuestions / questions.length) * 100 : 0;
}

function calculateNPSCategory(score: number): 'detractor' | 'passive' | 'promoter' {
  if (score <= 6) return 'detractor';
  if (score <= 8) return 'passive';
  return 'promoter';
}

async function sendToAnalytics(event: string, data: any): Promise<void> {
  // In a real implementation, this would send to your analytics service
  console.log(`[ANALYTICS] ${event}:`, data);
}

async function sendToErrorHandling(submission: FeedbackSubmission): Promise<void> {
  // In a real implementation, this would integrate with error handling system
  console.log('[ERROR HANDLING] Bug report submitted:', submission);
}

async function generateAnalytics(submissions: FeedbackSubmission[]): Promise<FeedbackAnalytics> {
  // In a real implementation, this would calculate comprehensive analytics
  // For now, return a basic structure
  return {
    summary: {
      totalSubmissions: submissions.length,
      averageRating: 0,
      satisfactionScore: 0,
      npsScore: 0,
      responseRate: 0,
      completionRate: 0,
      timeToResolution: 0,
      breakdown: {
        byType: {},
        bySource: {},
        byTool: {},
        byCategory: {},
        byStatus: {},
        byPriority: {},
        bySentiment: {},
        byJourneyStage: {},
      },
      period: {
        start: new Date(),
        end: new Date(),
      },
    },
    trends: [],
    insights: [],
    recommendations: [],
    alerts: [],
    benchmarks: [],
    segments: [],
    correlation: [],
    predictions: [],
  };
}

async function analyzeSentiment(text: string): Promise<any> {
  // In a real implementation, this would call a sentiment analysis service
  // For now, return a basic sentiment analysis
  const hasPositiveWords = /good|great|excellent|love|awesome|fantastic/i.test(text);
  const hasNegativeWords = /bad|terrible|hate|awful|poor|worst/i.test(text);

  if (hasPositiveWords && !hasNegativeWords) {
    return { label: 'positive', score: 0.7 };
  } else if (hasNegativeWords && !hasPositiveWords) {
    return { label: 'negative', score: -0.7 };
  } else {
    return { label: 'neutral', score: 0 };
  }
}

export default useFeedbackStore;
