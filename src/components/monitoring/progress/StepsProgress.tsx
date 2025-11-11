/**
 * Steps Progress Component
 * A step-by-step progress indicator showing the current stage and completed steps
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { ProgressOperation, ProgressStep, ProgressStatus } from '@/monitoring/progress-indicators-types';
import { useProgressConfig } from '@/monitoring/progress-manager';

interface StepsProgressProps {
  operation: ProgressOperation;
  steps: ProgressStep[];
  className?: string;
  showLabels?: boolean;
  showDescriptions?: boolean;
  vertical?: boolean;
  compact?: boolean;
  'aria-label'?: string;
}

const STATUS_COLORS = {
  pending: 'border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-700',
  running: 'border-blue-500 bg-blue-100 dark:border-blue-400 dark:bg-blue-900/30',
  completed: 'border-green-500 bg-green-100 dark:border-green-400 dark:bg-green-900/30',
  failed: 'border-red-500 bg-red-100 dark:border-red-400 dark:bg-red-900/30',
  paused: 'border-yellow-500 bg-yellow-100 dark:border-yellow-400 dark:bg-yellow-900/30',
};

const STATUS_ICONS = {
  pending: null,
  running: (
    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  ),
  completed: (
    <svg className="h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
  failed: (
    <svg className="h-3 w-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
  paused: (
    <svg className="h-3 w-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
};

export const StepsProgress: React.FC<StepsProgressProps> = ({
  operation,
  steps,
  className,
  showLabels = true,
  showDescriptions = false,
  vertical = false,
  compact = false,
  'aria-label': ariaLabel,
}) => {
  const globalConfig = useProgressConfig();

  // Find current step index
  const currentStepIndex = steps.findIndex(step =>
    step.status === 'running' || step.status === 'pending'
  );

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalProgress = (completedSteps / steps.length) * 100;

  if (vertical) {
    return (
      <div
        className={cn('flex flex-col space-y-4', className)}
        role="list"
        aria-label={ariaLabel || `${operation.name} steps`}
      >
        {steps.map((step, index) => (
          <VerticalStep
            key={step.id}
            step={step}
            index={index}
            isCurrent={index === currentStepIndex}
            isCompleted={step.status === 'completed'}
            showLabel={showLabels}
            showDescription={showDescriptions}
            compact={compact}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn('w-full', className)}
      role="list"
      aria-label={ariaLabel || `${operation.name} steps`}
    >
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
          <span>{operation.name}</span>
          <span>{Math.round(totalProgress)}% complete</span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-between relative">
        {/* Connection line */}
        <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-200 dark:bg-gray-700 -z-10" />
        <div
          className="absolute left-0 top-5 h-0.5 bg-blue-500 transition-all duration-300 -z-10"
          style={{ width: `${totalProgress}%` }}
        />

        {steps.map((step, index) => (
          <HorizontalStep
            key={step.id}
            step={step}
            index={index}
            total={steps.length}
            isCurrent={index === currentStepIndex}
            isCompleted={step.status === 'completed'}
            showLabel={showLabels}
            showDescription={showDescriptions}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
};

// Horizontal step component
const HorizontalStep: React.FC<{
  step: ProgressStep;
  index: number;
  total: number;
  isCurrent: boolean;
  isCompleted: boolean;
  showLabel: boolean;
  showDescription: boolean;
  compact: boolean;
}> = ({ step, index, total, isCurrent, isCompleted, showLabel, showDescription, compact }) => {
  const statusColors = STATUS_COLORS[step.status];
  const statusIcon = STATUS_ICONS[step.status];

  return (
    <div
      className="flex flex-col items-center relative z-10"
      role="listitem"
    >
      {/* Step indicator */}
      <div
        className={cn(
          'w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300',
          statusColors,
          isCurrent && 'ring-2 ring-blue-200 dark:ring-blue-800',
          compact && 'w-8 h-8'
        )}
      >
        {statusIcon || (
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {index + 1}
          </span>
        )}
      </div>

      {/* Step info */}
      {(showLabel || showDescription) && !compact && (
        <div className="mt-2 text-center max-w-[120px]">
          {showLabel && (
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {step.name}
            </div>
          )}

          {showDescription && step.description && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {step.description}
            </div>
          )}

          {step.error && (
            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
              {step.error.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Vertical step component
const VerticalStep: React.FC<{
  step: ProgressStep;
  index: number;
  isCurrent: boolean;
  isCompleted: boolean;
  showLabel: boolean;
  showDescription: boolean;
  compact: boolean;
}> = ({ step, index, isCurrent, isCompleted, showLabel, showDescription, compact }) => {
  const statusColors = STATUS_COLORS[step.status];
  const statusIcon = STATUS_ICONS[step.status];

  return (
    <div
      className="flex items-start space-x-3 relative"
      role="listitem"
    >
      {/* Connection line */}
      {index > 0 && (
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 -translate-y-6" />
      )}

      {/* Step indicator */}
      <div
        className={cn(
          'w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 relative z-10',
          statusColors,
          isCurrent && 'ring-2 ring-blue-200 dark:ring-blue-800',
          compact && 'w-8 h-8'
        )}
      >
        {statusIcon || (
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {index + 1}
          </span>
        )}
      </div>

      {/* Step info */}
      <div className="flex-1 min-w-0">
        {showLabel && (
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {step.name}
          </div>
        )}

        {showDescription && step.description && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {step.description}
          </div>
        )}

        {step.error && (
          <div className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center space-x-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{step.error.message}</span>
          </div>
        )}

        {/* Progress bar for current step */}
        {isCurrent && step.progress < 100 && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Step progress</span>
              <span>{Math.round(step.progress)}%</span>
            </div>
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
  );
};

// Compact horizontal version
export const StepsProgressCompact: React.FC<Omit<StepsProgressProps, 'showLabels' | 'showDescriptions' | 'compact'>> = (props) => (
  <StepsProgress
    {...props}
    showLabels={false}
    showDescriptions={false}
    compact={true}
  />
);

// Timeline version for showing step details
export const StepsProgressTimeline: React.FC<Omit<StepsProgressProps, 'vertical' | 'compact'>> = (props) => (
  <StepsProgress
    {...props}
    vertical={true}
    showLabels={true}
    showDescriptions={true}
  />
);
