/**
 * Feedback System Main Entry Point
 * Central exports for the feedback collection system
 */

// Core components
export { default as FeedbackProvider } from '@/components/feedback/feedback-provider';
export { default as FeedbackManager, useFeedbackManager } from '@/components/feedback/feedback-manager';

// UI Components
export { default as FeedbackModal } from '@/components/feedback/feedback-modal';
export { default as FeedbackTooltip } from '@/components/feedback/feedback-tooltip';
export { default as FeedbackInline } from '@/components/feedback/feedback-inline';
export { default as FeedbackTrigger } from '@/components/feedback/feedback-trigger';

// Dashboard and UI
export { default as FeedbackDashboard } from '@/components/feedback/dashboard/feedback-dashboard';
export { default as PreferenceManager } from '@/components/feedback/preferences/preference-manager';

// State Management
export { default as useFeedbackStore } from '@/lib/feedback/feedback-store';

// Preferences
export { default as useFeedbackPreferences } from '@/lib/feedback/preferences/user-preferences';

// Analytics
export { default as sentimentAnalyzer, analyzeSentiment } from '@/lib/feedback/analytics/sentiment-analyzer';
export { default as feedbackAnalyticsEngine, processFeedbackAnalytics } from '@/lib/feedback/analytics/feedback-analytics';

// Integrations
export { default as feedbackErrorHandler, reportError, reportErrorWithConfirmation } from '@/lib/feedback/integrations/error-handler';
export {
  default as feedbackMonitoringSystem,
  trackFeedbackSubmission,
  trackFeedbackView,
  trackFeedbackDismissal
} from '@/lib/feedback/integrations/monitoring';

// Templates
export { toolSpecificTemplates } from '@/lib/feedback/templates/tool-templates';

// Types
export type {
  FeedbackConfig,
  UserFeedbackPreferences,
  FeedbackSubmission,
  FeedbackAnalytics,
  FeedbackTemplate,
  FeedbackTriggerConfig,
  SentimentAnalysis,
  FeedbackInsight,
  FeedbackRecommendation,
  FeedbackAlert,
  FeedbackType,
  FeedbackStatus,
  FeedbackPriority,
} from '@/types/feedback';

// Version info
export const FEEDBACK_SYSTEM_VERSION = '1.0.0';
export const FEEDBACK_SYSTEM_BUILD = '2024-11-11';
