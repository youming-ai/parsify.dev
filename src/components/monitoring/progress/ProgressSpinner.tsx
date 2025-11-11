/**
 * Progress Spinner Component
 * Various spinning loader animations for different use cases
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { ProgressOperation, ProgressConfig } from '@/monitoring/progress-indicators-types';
import { useProgressConfig } from '@/monitoring/progress-manager';

interface ProgressSpinnerProps {
  operation: ProgressOperation;
  config?: Partial<ProgressConfig>;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots-ring' | 'pulse-ring' | 'gear' | 'refresh' | 'ellipsis';
  color?: string;
  speed?: 'slow' | 'normal' | 'fast';
  showLabel?: boolean;
  'aria-label'?: string;
}

const SPINNER_SIZES = {
  xs: 'w-4 h-4',
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const ANIMATION_SPEEDS = {
  slow: 'animate-spin-slow',
  normal: 'animate-spin',
  fast: 'animate-spin-fast',
};

export const ProgressSpinner: React.FC<ProgressSpinnerProps> = ({
  operation,
  config,
  className,
  size = 'md',
  variant = 'spinner',
  color,
  speed = 'normal',
  showLabel,
  'aria-label': ariaLabel,
}) => {
  const globalConfig = useProgressConfig();
  const localConfig = { ...globalConfig, ...config };

  const shouldShowLabel = showLabel ?? localConfig.showLabel;

  const spinnerColor = color || (operation.status === 'failed'
    ? 'text-red-500'
    : operation.status === 'completed'
      ? 'text-green-500'
      : operation.status === 'paused'
        ? 'text-yellow-500'
        : 'text-blue-500'
  );

  const renderSpinner = () => {
    switch (variant) {
      case 'spinner':
        return (
          <svg
            className={cn(
              SPINNER_SIZES[size],
              spinnerColor,
              ANIMATION_SPEEDS[speed],
              'transition-colors duration-300'
            )}
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );

      case 'dots-ring':
        return (
          <div className={cn('relative', SPINNER_SIZES[size])}>
            <svg
              className={cn(
                'w-full h-full',
                spinnerColor,
                'transition-colors duration-300'
              )}
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeDasharray="31.416"
                strokeDashoffset="31.416"
                className={cn(
                  operation.status === 'running' && localConfig.animate && 'animate-pulse-dash'
                )}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      'rounded-full bg-current',
                      size === 'xs' ? 'w-1 h-1' :
                      size === 'sm' ? 'w-1.5 h-1.5' :
                      size === 'md' ? 'w-2 h-2' :
                      size === 'lg' ? 'w-2.5 h-2.5' :
                      'w-3 h-3',
                      operation.status === 'running' && localConfig.animate && 'animate-pulse'
                    )}
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'pulse-ring':
        return (
          <div className={cn('relative', SPINNER_SIZES[size])}>
            <div
              className={cn(
                'absolute inset-0 rounded-full border-2',
                spinnerColor.replace('text-', 'border-')
              )}
            />
            <div
              className={cn(
                'absolute inset-0 rounded-full border-2',
                spinnerColor.replace('text-', 'border-'),
                operation.status === 'running' && localConfig.animate && 'animate-ping'
              )}
            />
            <div
              className={cn(
                'absolute inset-2 rounded-full',
                spinnerColor.replace('text-', 'bg-'),
                'opacity-75',
                operation.status === 'running' && localConfig.animate && 'animate-pulse'
              )}
            />
          </div>
        );

      case 'gear':
        return (
          <svg
            className={cn(
              SPINNER_SIZES[size],
              spinnerColor,
              operation.status === 'running' && localConfig.animate && ANIMATION_SPEEDS[speed]
            )}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 1l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-2.01L12 1z" />
          </svg>
        );

      case 'refresh':
        return (
          <svg
            className={cn(
              SPINNER_SIZES[size],
              spinnerColor,
              operation.status === 'running' && localConfig.animate && ANIMATION_SPEEDS[speed]
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        );

      case 'ellipsis':
        return (
          <div className={cn('flex space-x-1', SPINNER_SIZES[size], 'items-center')}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'rounded-full bg-current',
                  size === 'xs' ? 'w-1 h-1' :
                  size === 'sm' ? 'w-1.5 h-1.5' :
                  size === 'md' ? 'w-2 h-2' :
                  size === 'lg' ? 'w-2.5 h-2.5' :
                  'w-3 h-3',
                  operation.status === 'running' && localConfig.animate && 'animate-bounce'
                )}
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={cn('flex flex-col items-center space-y-2', className)}
      role="progressbar"
      aria-label={ariaLabel || `${operation.name} loading`}
      aria-busy={operation.status === 'running'}
    >
      {renderSpinner()}

      {shouldShowLabel && (
        <div className="text-sm text-gray-600 dark:text-gray-300 text-center">
          {operation.name}
        </div>
      )}

      {operation.stepName && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {operation.stepName}
        </div>
      )}

      {operation.error && (
        <div className="text-xs text-red-600 dark:text-red-400 text-center max-w-[200px]">
          {operation.error.message}
        </div>
      )}
    </div>
  );
};

// Button spinner for inline use
export const ButtonSpinner: React.FC<{
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  variant?: 'spinner' | 'dots';
}> = ({ size = 'sm', className, variant = 'spinner' }) => {
  const operation: ProgressOperation = {
    id: 'button-spinner',
    toolId: 'button',
    sessionId: 'session',
    name: 'Loading',
    description: '',
    type: 'background',
    category: 'Security & Encryption Suite',
    priority: 'medium',
    status: 'running',
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    canCancel: false,
  };

  return (
    <ProgressSpinner
      operation={operation}
      size={size}
      variant={variant}
      showLabel={false}
      className={className}
    />
  );
};

// Inline spinner for text
export const InlineSpinner: React.FC<{
  text?: string;
  size?: 'xs' | 'sm';
  className?: string;
}> = ({ text, size = 'xs', className }) => {
  const operation: ProgressOperation = {
    id: 'inline-spinner',
    toolId: 'inline',
    sessionId: 'session',
    name: text || 'Loading',
    description: '',
    type: 'background',
    category: 'Security & Encryption Suite',
    priority: 'medium',
    status: 'running',
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    canCancel: false,
  };

  return (
    <div className={cn('inline-flex items-center space-x-2', className)}>
      <ProgressSpinner
        operation={operation}
        size={size}
        variant='spinner'
        showLabel={false}
      />
      {text && (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {text}
        </span>
      )}
    </div>
  );
};

// Full page spinner
export const PageSpinner: React.FC<{
  message?: string;
  className?: string;
}> = ({ message = 'Loading...', className }) => {
  const operation: ProgressOperation = {
    id: 'page-spinner',
    toolId: 'page',
    sessionId: 'session',
    name: message,
    description: '',
    type: 'background',
    category: 'Security & Encryption Suite',
    priority: 'medium',
    status: 'running',
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    canCancel: false,
  };

  return (
    <div className={cn('flex flex-col items-center justify-center min-h-[200px] space-y-4', className)}>
      <ProgressSpinner
        operation={operation}
        size="xl"
        variant="spinner"
        showLabel={true}
      />
      <p className="text-lg text-gray-600 dark:text-gray-300">
        {message}
      </p>
    </div>
  );
};
