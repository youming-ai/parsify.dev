/**
 * Feedback Trigger Component
 * Handles automatic trigger evaluation and display of feedback requests
 */

'use client';

import React, { useEffect, useState } from 'react';
import { FeedbackModal } from './feedback-modal';
import { FeedbackInline } from './feedback-inline';
import { useFeedbackStore } from '@/lib/feedback/feedback-store';
import { FeedbackTriggerConfig, FeedbackTemplate } from '@/types/feedback';

interface FeedbackTriggerProps {
  triggers: FeedbackTriggerConfig[];
  templates: Record<string, FeedbackTemplate>;
  children?: React.ReactNode;
}

export function FeedbackTrigger({ triggers, templates, children }: FeedbackTriggerProps) {
  const {
    config,
    userPreferences,
    evaluateTriggers,
    openFeedbackModal,
    pendingRequests,
    dismissRequest,
  } = useFeedbackStore();

  const [activeTrigger, setActiveTrigger] = useState<FeedbackTriggerConfig | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!config.enabled || !userPreferences.enabled || userPreferences.optedOut) {
      return;
    }

    const interval = setInterval(() => {
      const eligibleTriggers = evaluateTriggers();

      if (eligibleTriggers.length > 0) {
        // Get the highest priority trigger
        const highestPriorityTrigger = eligibleTriggers.reduce((highest, current) => {
          const currentPriority = getTriggerPriority(current);
          const highestPriority = getTriggerPriority(highest);
          return currentPriority > highestPriority ? current : highest;
        });

        setActiveTrigger(highestPriorityTrigger);

        // Show modal after delay
        setTimeout(() => {
          setShowModal(true);
        }, config.display.delay * 1000);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [config, userPreferences, evaluateTriggers]);

  useEffect(() => {
    // Auto-dismiss if user has given enough feedback recently
    const recentSubmissions = userPreferences.totalGiven;
    const maxRequests = config.frequency.maxRequestsPerSession;

    if (recentSubmissions >= maxRequests) {
      setActiveTrigger(null);
      setShowModal(false);
    }
  }, [userPreferences.totalGiven, config.frequency.maxRequestsPerSession]);

  const handleTriggerAction = (template: FeedbackTemplate) => {
    openFeedbackModal(template, activeTrigger?.id);
    setShowModal(false);
    setActiveTrigger(null);
  };

  const handleDismiss = () => {
    if (activeTrigger) {
      dismissRequest(activeTrigger.id);
    }
    setShowModal(false);
    setActiveTrigger(null);
  };

  const getTriggerPriority = (trigger: FeedbackTriggerConfig): number => {
    // Assign priority values (higher = more important)
    const typePriorities: Record<string, number> = {
      'error_based': 10,
      'performance_based': 8,
      'behavior_based': 6,
      'time_based': 4,
      'event_based': 2,
      'manual': 1,
    };

    return typePriorities[trigger.type] || 0;
  };

  if (!config.enabled || !userPreferences.enabled || userPreferences.optedOut) {
    return <>{children}</>;
  }

  return (
    <>
      {children}

      {/* Active Trigger Display */}
      {activeTrigger && !showModal && (
        <FeedbackInline
          type={activeTrigger.template.type}
          title={activeTrigger.name}
          subtitle={activeTrigger.description}
          position="floating"
          showByDefault={true}
        />
      )}

      {/* Modal for detailed feedback */}
      {showModal && activeTrigger && templates[activeTrigger.template.id] && (
        <FeedbackModal
          isOpen={showModal}
          onClose={handleDismiss}
          template={templates[activeTrigger.template.id]}
        />
      )}

      {/* Passive feedback inline component */}
      <FeedbackInline
        type="general"
        title="Quick feedback?"
        subtitle="Help us improve"
        position="floating"
        showByDefault={false}
      />
    </>
  );
}

export default FeedbackTrigger;
