/**
 * Progress Timeline Component
 * Timeline-based progress indicator for multi-stage operations
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  ProgressOperation,
  ProgressStage,
  ProgressStep,
  ProgressStatus
} from '@/monitoring/progress-indicators-types';

interface ProgressTimelineProps {
  operation: ProgressOperation;
  stages: ProgressStage[];
  className?: string;
  showDates?: boolean;
  showDuration?: boolean;
  compact?: boolean;
  interactive?: boolean;
  onStageClick?: (stage: ProgressStage) => void;
  'aria-label'?: string;
}

const STATUS_ICONS = {
  pending: (
    <div className="w-3 h-3 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
  ),
  running: (
    <div className="w-3 h-3 border-2 border-blue-500 rounded-full animate-pulse">
      <div className="w-2 h-2 bg-blue-500 rounded-full m-auto mt-0.5" />
    </div>
  ),
  completed: (
    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
  failed: (
    <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
  paused: (
    <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  cancelled: (
    <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  ),
};

const STATUS_COLORS = {
  pending: 'text-gray-400 dark:text-gray-600',
  running: 'text-blue-500',
  completed: 'text-green-500',
  failed: 'text-red-500',
  paused: 'text-yellow-500',
  cancelled: 'text-gray-500',
};

export const ProgressTimeline: React.FC<ProgressTimelineProps> = ({
  operation,
  stages,
  className,
  showDates = false,
  showDuration = false,
  compact = false,
  interactive = false,
  onStageClick,
  'aria-label': ariaLabel,
}) => {
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  // Find current active stage
  const currentStageIndex = stages.findIndex(stage =>
    stage.status === 'running' || stage.status === 'pending'
  );

  const totalProgress = (stages.filter(stage => stage.status === 'completed').length / stages.length) * 100;

  const toggleStageExpansion = (stageId: string) => {
    setExpandedStages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stageId)) {
        newSet.delete(stageId);
      } else {
        newSet.add(stageId);
      }
      return newSet;
    });
  };

  const handleStageClick = (stage: ProgressStage) => {
    if (interactive && onStageClick) {
      onStageClick(stage);
    }

    if (!compact && stage.steps.length > 0) {
      toggleStageExpansion(stage.id);
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div
      className={cn('w-full', className)}
      role="list"
      aria-label={ariaLabel || `${operation.name} timeline`}
    >
      {/* Overall progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {operation.name}
          </span>
          <span className="text-gray-600 dark:text-gray-300">
            {Math.round(totalProgress)}% complete
          </span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-6 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700">
          <div
            className="w-0.5 bg-blue-500 transition-all duration-500"
            style={{ height: `${totalProgress}%` }}
          />
        </div>

        {/* Stages */}
        {stages.map((stage, index) => {
          const isCurrent = index === currentStageIndex;
          const isExpanded = expandedStages.has(stage.id);
          const isHovered = hoveredStage === stage.id;

          return (
            <div
              key={stage.id}
              className={cn(
                'relative flex items-start mb-6',
                interactive && 'cursor-pointer',
                isHovered && 'bg-gray-50 dark:bg-gray-800 -mx-4 px-4 py-2 rounded-lg transition-colors'
              )}
              onClick={() => handleStageClick(stage)}
              onMouseEnter={() => interactive && setHoveredStage(stage.id)}
              onMouseLeave={() => setHoveredStage(null)}
              role="listitem"
            >
              {/* Stage indicator */}
              <div
                className={cn(
                  'relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-gray-900 border-2',
                  STATUS_COLORS[stage.status].replace('text-', 'border-'),
                  isCurrent && 'ring-2 ring-blue-200 dark:ring-blue-800'
                )}
              >
                {STATUS_ICONS[stage.status]}
              </div>

              {/* Stage content */}
              <div className="ml-4 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      'font-medium text-gray-900 dark:text-gray-100',
                      compact && 'text-sm'
                    )}>
                      {stage.name}
                    </h3>

                    {stage.description && !compact && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {stage.description}
                      </p>
                    )}

                    {/* Step count */}
                    {!compact && stage.steps.length > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {stage.steps.filter(s => s.status === 'completed').length} of {stage.steps.length} steps completed
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 ml-4">
                    {/* Progress */}
                    <div className="text-sm text-gray-600 dark:text-gray-300 font-mono">
                      {Math.round(stage.progress)}%
                    </div>

                    {/* Duration */}
                    {showDuration && stage.duration && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDuration(stage.duration)}
                      </div>
                    )}

                    {/* Date */}
                    {showDates && stage.completedAt && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(stage.completedAt)}
                      </div>
                    )}

                    {/* Expand/collapse indicator */}
                    {!compact && stage.steps.length > 0 && (
                      <button
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        aria-label={isExpanded ? 'Collapse stage' : 'Expand stage'}
                      >
                        <svg
                          className={cn(
                            'w-4 h-4 transform transition-transform',
                            isExpanded && 'rotate-90'
                          )}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Stage error */}
                {stage.steps.some(s => s.error) && (
                  <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {stage.steps.find(s => s.error)?.error?.message}
                  </div>
                )}

                {/* Expanded steps */}
                {isExpanded && !compact && stage.steps.length > 0 && (
                  <div className="mt-4 ml-4 space-y-3 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                    {stage.steps.map((step, stepIndex) => (
                      <div
                        key={step.id}
                        className="flex items-start space-x-3"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {STATUS_ICONS[step.status]}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {step.name}
                            </h4>

                            <div className="flex items-center space-x-2">
                              {step.progress > 0 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                  {Math.round(step.progress)}%
                                </span>
                              )}

                              {step.duration && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDuration(step.duration)}
                                </span>
                              )}
                            </div>
                          </div>

                          {step.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                              {step.description}
                            </p>
                          )}

                          {step.error && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              {step.error.message}
                            </p>
                          )}

                          {/* Step progress bar */}
                          {step.progress > 0 && step.progress < 100 && (
                            <div className="mt-2">
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                                <div
                                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                                  style={{ width: `${step.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Compact version for tight spaces
export const ProgressTimelineCompact: React.FC<Omit<ProgressTimelineProps, 'showDates' | 'showDuration' | 'compact'>> = (props) => (
  <ProgressTimeline
    {...props}
    showDates={false}
    showDuration={false}
    compact={true}
  />
);

// Interactive version with click handlers
export const ProgressTimelineInteractive: React.FC<ProgressTimelineProps> = (props) => (
  <ProgressTimeline
    {...props}
    interactive={true}
    showDates={true}
    showDuration={true}
  />
);
