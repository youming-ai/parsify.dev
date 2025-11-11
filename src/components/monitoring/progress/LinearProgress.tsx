/**
 * Linear Progress Bar Component
 * A customizable horizontal progress bar with smooth animations and accessibility support
 */

import React, { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ProgressOperation, ProgressConfig, ProgressVariant } from '@/monitoring/progress-indicators-types';
import { useProgressConfig } from '@/monitoring/progress-manager';

interface LinearProgressProps {
  operation: ProgressOperation;
  config?: Partial<ProgressConfig>;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  showLabel?: boolean;
  showPercentage?: boolean;
  showEta?: boolean;
  height?: number;
  animated?: boolean;
}

const VARIANT_STYLES = {
  default: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  info: 'bg-cyan-500',
};

const SIZE_CLASSES = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
  xl: 'h-6',
};

export const LinearProgress: React.FC<LinearProgressProps> = ({
  operation,
  config,
  className,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  showLabel: propShowLabel,
  showPercentage: propShowPercentage,
  showEta: propShowEta,
  height,
  animated = true,
}) => {
  const globalConfig = useProgressConfig();
  const localConfig = { ...globalConfig, ...config };

  const [displayProgress, setDisplayProgress] = useState(operation.progress);
  const [isAnimating, setIsAnimating] = useState(false);

  // Determine what to show based on props and config
  const shouldShowLabel = propShowLabel ?? localConfig.showLabel;
  const shouldShowPercentage = propShowPercentage ?? localConfig.showPercentage;
  const shouldShowEta = propShowEta ?? localConfig.showEta;

  // Get variant based on operation status
  const variant: ProgressVariant = useMemo(() => {
    switch (operation.status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'warning';
      default:
        return localConfig.variant;
    }
  }, [operation.status, localConfig.variant]);

  // Smooth progress transitions
  useEffect(() => {
    if (localConfig.smoothTransitions && animated) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayProgress(operation.progress);
        setIsAnimating(false);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setDisplayProgress(operation.progress);
    }
  }, [operation.progress, localConfig.smoothTransitions, animated]);

  // Calculate ETA display
  const etaDisplay = useMemo(() => {
    if (!shouldShowEta || !operation.eta) return null;

    const now = new Date();
    const timeRemaining = operation.eta.getTime() - now.getTime();

    if (timeRemaining <= 0) return null;

    const minutes = Math.floor(timeRemaining / (60 * 1000));
    const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s remaining`;
    } else {
      return `${seconds}s remaining`;
    }
  }, [operation.eta, shouldShowEta]);

  // Calculate progress width with bounds checking
  const progressWidth = Math.min(100, Math.max(0, displayProgress));

  // Determine bar height
  const barHeight = height || (() => {
    switch (localConfig.size) {
      case 'xs': return 4;
      case 'sm': return 8;
      case 'md': return 12;
      case 'lg': return 16;
      case 'xl': return 24;
      default: return 12;
    }
  })();

  return (
    <div
      className={cn('w-full', className)}
      role="progressbar"
      aria-valuenow={Math.round(operation.progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel || `${operation.name} progress`}
      aria-describedby={ariaDescribedby}
    >
      {/* Label and info */}
      {(shouldShowLabel || shouldShowPercentage || etaDisplay) && (
        <div className="flex justify-between items-center mb-2 text-sm">
          {shouldShowLabel && (
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {operation.name}
              </span>
              {operation.stepName && (
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  {operation.stepName}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center space-x-3">
            {shouldShowPercentage && (
              <span className="text-gray-600 dark:text-gray-300 font-mono text-sm">
                {Math.round(operation.progress)}%
              </span>
            )}

            {etaDisplay && (
              <span className="text-gray-500 dark:text-gray-400 text-xs">
                {etaDisplay}
              </span>
            )}

            {operation.throughput && (
              <span className="text-gray-500 dark:text-gray-400 text-xs">
                {formatThroughput(operation.throughput)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Progress bar container */}
      <div
        className={cn(
          'relative w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
          SIZE_CLASSES[localConfig.size] || '',
          'transition-all duration-200'
        )}
        style={{ height: `${barHeight}px` }}
      >
        {/* Progress fill */}
        <div
          className={cn(
            'absolute top-0 left-0 h-full rounded-full transition-all duration-300 ease-out',
            VARIANT_STYLES[variant],
            localConfig.animate && animated && 'relative',
            isAnimating && 'transition-all duration-300 ease-out'
          )}
          style={{
            width: `${progressWidth}%`,
            transitionDuration: isAnimating ? '300ms' : '0ms'
          }}
        >
          {/* Animated shimmer effect */}
          {localConfig.animate && animated && operation.status === 'running' && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          )}
        </div>

        {/* Step indicators */}
        {operation.totalSteps && operation.totalSteps > 1 && localConfig.showSteps && (
          <div className="absolute inset-0 flex">
            {Array.from({ length: operation.totalSteps }, (_, i) => (
              <div
                key={i}
                className={cn(
                  'flex-1 border-r border-gray-300 dark:border-gray-600',
                  'last:border-r-0',
                  i < operation.currentStep && 'bg-white/10'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Error indicator */}
      {operation.error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{operation.error.message}</span>
        </div>
      )}

      {/* Status-specific indicators */}
      {operation.status === 'paused' && (
        <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 flex items-center space-x-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>Paused</span>
        </div>
      )}
    </div>
  );
};

// Helper function to format throughput
function formatThroughput(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return '0 B/s';

  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  let size = bytesPerSecond;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// Compact version for inline use
export const LinearProgressCompact: React.FC<Omit<LinearProgressProps, 'showLabel' | 'height'>> = (props) => (
  <LinearProgress
    {...props}
    showLabel={false}
    height={4}
    className={cn('max-w-xs', props.className)}
  />
);

// Small version for tight spaces
export const LinearProgressSmall: React.FC<Omit<LinearProgressProps, 'height'>> = (props) => (
  <LinearProgress
    {...props}
    config={{ ...props.config, size: 'sm' }}
    height={8}
    showEta={false}
  />
);
