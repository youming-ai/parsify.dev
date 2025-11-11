/**
 * Feedback Provider Integration Component
 * Main integration point for the entire feedback collection system
 */

'use client';

import React, { useEffect, useState } from 'react';
import { FeedbackProvider as BaseFeedbackProvider } from './feedback-manager';
import { feedbackErrorHandler } from '@/lib/feedback/integrations/error-handler';
import { feedbackMonitoringSystem } from '@/lib/feedback/integrations/monitoring';
import { FeedbackConfig, FeedbackTriggerConfig, FeedbackTemplate } from '@/types/feedback';

interface FeedbackProviderProps {
  children: React.ReactNode;
  config?: Partial<FeedbackConfig>;
  templates?: Record<string, FeedbackTemplate>;
  triggers?: FeedbackTriggerConfig[];
  errorHandling?: {
    enabled?: boolean;
    autoReport?: boolean;
    severityThreshold?: 'low' | 'medium' | 'high' | 'critical';
  };
  monitoring?: {
    enabled?: boolean;
    analyticsProvider?: 'google_analytics' | 'custom' | 'none';
    performanceTracking?: boolean;
    errorTracking?: boolean;
  };
  preferences?: {
    enabled?: boolean;
    defaultProfile?: string;
    adaptiveFrequency?: boolean;
  };
}

export function FeedbackProvider({
  children,
  config,
  templates,
  triggers,
  errorHandling = {},
  monitoring = {},
  preferences = {},
}: FeedbackProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    const initializeFeedbackSystem = async () => {
      try {
        // Initialize error handling
        if (errorHandling.enabled !== false) {
          feedbackErrorHandler.updateConfig({
            enabled: errorHandling.enabled ?? true,
            autoCreateReports: errorHandling.autoReport ?? true,
            severityThreshold: errorHandling.severityThreshold ?? 'medium',
          });
        }

        // Initialize monitoring
        if (monitoring.enabled !== false) {
          feedbackMonitoringSystem.updateConfig({
            enabled: monitoring.enabled ?? true,
            analyticsProvider: monitoring.analyticsProvider ?? 'custom',
            performanceMonitoring: monitoring.performanceTracking ?? true,
            errorTracking: monitoring.errorTracking ?? true,
          });
        }

        // Track system initialization
        feedbackMonitoringSystem.trackEvent('feedback_system_initialized', {
          errorHandling: errorHandling.enabled ?? true,
          monitoring: monitoring.enabled ?? true,
          preferences: preferences.enabled ?? true,
        });

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize feedback system:', error);
        setInitializationError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    initializeFeedbackSystem();
  }, [errorHandling, monitoring, preferences]);

  if (initializationError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-medium">Feedback System Error</h3>
        <p className="text-red-600 text-sm mt-1">{initializationError}</p>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800 text-sm">Initializing feedback system...</p>
      </div>
    );
  }

  return (
    <BaseFeedbackProvider
      config={config}
      templates={templates}
      triggers={triggers}
    >
      {children}
    </BaseFeedbackProvider>
  );
}

export default FeedbackProvider;
