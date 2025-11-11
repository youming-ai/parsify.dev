/**
 * Feedback Manager Component
 * Main component that orchestrates all feedback collection functionality
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { FeedbackModal } from './feedback-modal';
import { FeedbackTooltip } from './feedback-tooltip';
import { FeedbackInline } from './feedback-inline';
import { FeedbackTrigger } from './feedback-trigger';
import { useFeedbackStore } from '@/lib/feedback/feedback-store';
import { FeedbackConfig, FeedbackTemplate, FeedbackTriggerConfig, FeedbackType } from '@/types/feedback';

interface FeedbackManagerContextType {
  openFeedback: (type?: FeedbackType, context?: Record<string, any>) => void;
  showTooltip: (props: any) => void;
  showInline: (props: any) => void;
  triggerFeedback: (triggerId: string) => void;
  isFeedbackEnabled: boolean;
}

const FeedbackManagerContext = createContext<FeedbackManagerContextType | null>(null);

export function useFeedbackManager() {
  const context = useContext(FeedbackManagerContext);
  if (!context) {
    throw new Error('useFeedbackManager must be used within a FeedbackProvider');
  }
  return context;
}

interface FeedbackProviderProps {
  children: React.ReactNode;
  config?: Partial<FeedbackConfig>;
  templates?: Record<string, FeedbackTemplate>;
  triggers?: FeedbackTriggerConfig[];
}

export function FeedbackProvider({
  children,
  config: initialConfig,
  templates: initialTemplates = {},
  triggers: initialTriggers = []
}: FeedbackProviderProps) {
  const {
    config,
    setConfig,
    startSession,
    trackInteraction,
    openFeedbackModal,
    evaluateTriggers,
    addTrigger,
  } = useFeedbackStore();

  const [templates, setTemplates] = useState<Record<string, FeedbackTemplate>>(initialTemplates);
  const [triggers, setTriggers] = useState<FeedbackTriggerConfig[]>(initialTriggers);
  const [tooltipState, setTooltipState] = useState<any>(null);
  const [inlineState, setInlineState] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      // Initialize with provided config
      if (initialConfig) {
        setConfig(initialConfig);
      }

      // Add initial triggers
      initialTriggers.forEach(trigger => addTrigger(trigger));

      // Start a feedback session
      startSession(generateSessionId());

      // Initialize default templates if none provided
      if (Object.keys(initialTemplates).length === 0) {
        setTemplates(getDefaultTemplates());
      }

      // Initialize default triggers if none provided
      if (initialTriggers.length === 0) {
        setTriggers(getDefaultTriggers());
      }

      setIsInitialized(true);
    }
  }, [initialConfig, initialTemplates, initialTriggers]);

  const openFeedback = (type: FeedbackType = 'general', context?: Record<string, any>) => {
    const template = templates[type] || templates['general'];
    if (template) {
      openFeedbackModal(template);
    }
    trackInteraction('feedback_opened', { type, context });
  };

  const showTooltip = (props: any) => {
    setTooltipState(props);
  };

  const showInline = (props: any) => {
    setInlineState(props);
  };

  const triggerFeedback = (triggerId: string) => {
    const trigger = triggers.find(t => t.id === triggerId);
    if (trigger && templates[trigger.template.id]) {
      openFeedbackModal(templates[trigger.template.id], triggerId);
    }
  };

  const contextValue: FeedbackManagerContextType = {
    openFeedback,
    showTooltip,
    showInline,
    triggerFeedback,
    isFeedbackEnabled: config.enabled,
  };

  return (
    <FeedbackManagerContext.Provider value={contextValue}>
      {children}

      {/* Automatic trigger system */}
      <FeedbackTrigger
        triggers={triggers}
        templates={templates}
      />

      {/* Tooltip for contextual feedback */}
      {tooltipState && (
        <FeedbackTooltip {...tooltipState} />
      )}

      {/* Inline feedback form */}
      {inlineState && (
        <FeedbackInline {...inlineState} />
      )}
    </FeedbackManagerContext.Provider>
  );
}

// Helper function to generate session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Default templates for common feedback types
function getDefaultTemplates(): Record<string, FeedbackTemplate> {
  return {
    general: {
      id: 'general',
      name: 'General Feedback',
      type: 'general',
      title: 'Share Your Feedback',
      description: 'Help us improve by sharing your thoughts and suggestions',
      questions: [
        {
          id: 'category',
          type: 'choice',
          text: 'What type of feedback would you like to share?',
          required: true,
          options: [
            { value: 'bug_report', label: 'Bug Report' },
            { value: 'feature_request', label: 'Feature Request' },
            { value: 'general', label: 'General Feedback' },
            { value: 'usability', label: 'Usability' },
          ],
          order: 1,
        },
        {
          id: 'subject',
          type: 'text',
          text: 'Subject',
          required: true,
          validation: { minLength: 5, maxLength: 100 },
          order: 2,
        },
        {
          id: 'message',
          type: 'textarea',
          text: 'Please describe your feedback in detail',
          required: true,
          validation: { minLength: 10, maxLength: 2000 },
          order: 3,
        },
      ],
      layout: {
        type: 'single_page',
        columns: 1,
        sections: [
          {
            id: 'main',
            title: 'Your Feedback',
            questions: ['category', 'subject', 'message'],
            order: 1,
          },
        ],
        progressIndicator: false,
        navigation: {
          showPrevious: false,
          showNext: false,
          showSubmit: true,
          showCancel: true,
          submitLabel: 'Send Feedback',
        },
      },
      styling: {
        theme: 'auto',
        colors: {
          primary: '#3B82F6',
          secondary: '#6B7280',
          accent: '#10B981',
          background: '#FFFFFF',
          surface: '#F9FAFB',
          text: '#111827',
          error: '#EF4444',
          warning: '#F59E0B',
          success: '#10B981',
        },
        typography: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
          },
          fontWeight: {
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
          },
          lineHeight: 1.5,
        },
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          '2xl': '3rem',
        },
        animations: {
          duration: 200,
          easing: 'ease-in-out',
          enabled: true,
        },
      },
      localization: {
        title: 'Share Your Feedback',
        description: 'Help us improve by sharing your thoughts and suggestions',
        questions: {
          category: 'What type of feedback would you like to share?',
          subject: 'Subject',
          message: 'Please describe your feedback in detail',
        },
        buttons: {
          previous: 'Previous',
          next: 'Next',
          submit: 'Send Feedback',
          cancel: 'Cancel',
          skip: 'Skip',
        },
        validation: {
          required: 'This field is required',
          invalid: 'Please enter a valid value',
          minLength: 'Minimum length is {min} characters',
          maxLength: 'Maximum length is {max} characters',
        },
      },
    },
    satisfaction: {
      id: 'satisfaction',
      name: 'Satisfaction Survey',
      type: 'satisfaction',
      title: 'How satisfied are you?',
      description: 'Your feedback helps us improve your experience',
      questions: [
        {
          id: 'overall',
          type: 'rating',
          text: 'Overall satisfaction',
          required: true,
          validation: { max: 5 },
          order: 1,
        },
        {
          id: 'easeOfUse',
          type: 'rating',
          text: 'Ease of use',
          required: true,
          validation: { max: 5 },
          order: 2,
        },
        {
          id: 'functionality',
          type: 'rating',
          text: 'Functionality',
          required: true,
          validation: { max: 5 },
          order: 3,
        },
        {
          id: 'comments',
          type: 'textarea',
          text: 'Any additional comments?',
          required: false,
          validation: { maxLength: 500 },
          order: 4,
        },
      ],
      layout: {
        type: 'single_page',
        columns: 1,
        sections: [
          {
            id: 'ratings',
            title: 'Rate Your Experience',
            questions: ['overall', 'easeOfUse', 'functionality'],
            order: 1,
          },
          {
            id: 'comments',
            title: 'Additional Feedback',
            questions: ['comments'],
            order: 2,
          },
        ],
        progressIndicator: true,
        navigation: {
          showPrevious: false,
          showNext: false,
          showSubmit: true,
          showCancel: true,
          submitLabel: 'Submit Rating',
        },
      },
      styling: {
        theme: 'auto',
        colors: {
          primary: '#10B981',
          secondary: '#6B7280',
          accent: '#3B82F6',
          background: '#FFFFFF',
          surface: '#F9FAFB',
          text: '#111827',
          error: '#EF4444',
          warning: '#F59E0B',
          success: '#10B981',
        },
        typography: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
          },
          fontWeight: {
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
          },
          lineHeight: 1.5,
        },
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          '2xl': '3rem',
        },
        animations: {
          duration: 200,
          easing: 'ease-in-out',
          enabled: true,
        },
      },
      localization: {
        title: 'How satisfied are you?',
        description: 'Your feedback helps us improve your experience',
        questions: {
          overall: 'Overall satisfaction',
          easeOfUse: 'Ease of use',
          functionality: 'Functionality',
          comments: 'Any additional comments?',
        },
        buttons: {
          previous: 'Previous',
          next: 'Next',
          submit: 'Submit Rating',
          cancel: 'Cancel',
          skip: 'Skip',
        },
        validation: {
          required: 'This field is required',
          invalid: 'Please enter a valid value',
          minLength: 'Minimum length is {min} characters',
          maxLength: 'Maximum length is {max} characters',
        },
      },
    },
  };
}

// Default triggers for common scenarios
function getDefaultTriggers(): FeedbackTriggerConfig[] {
  return [
    {
      id: 'first_session',
      name: 'First Session Feedback',
      description: 'Ask for feedback after first session',
      type: 'event_based',
      conditions: [
        { field: 'sessionDuration', operator: 'greater_than', value: 5, required: true },
        { field: 'totalInteractions', operator: 'greater_than', value: 3, required: true },
      ],
      template: getDefaultTemplates().general,
      probability: 0.3,
      cooldown: 1440, // 24 hours
      enabled: true,
    },
    {
      id: 'tool_completion',
      name: 'Tool Completion Feedback',
      description: 'Ask for feedback after using a tool',
      type: 'event_based',
      conditions: [
        { field: 'toolsUsed', operator: 'contains', value: 'json-formatter', required: true },
        { field: 'timeInCurrentTool', operator: 'greater_than', value: 2, required: true },
      ],
      template: getDefaultTemplates().satisfaction,
      probability: 0.2,
      cooldown: 480, // 8 hours
      enabled: true,
    },
    {
      id: 'error_encountered',
      name: 'Error Feedback',
      description: 'Ask for feedback when errors occur',
      type: 'error_based',
      conditions: [
        { field: 'errorsEncountered', operator: 'greater_than', value: 0, required: true },
      ],
      template: getDefaultTemplates().general,
      probability: 0.8,
      cooldown: 60, // 1 hour
      enabled: true,
    },
  ];
}

export default FeedbackProvider;
