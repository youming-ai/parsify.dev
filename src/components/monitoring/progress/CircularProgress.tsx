/**
 * Circular Progress Component
 * A customizable circular/radial progress indicator with smooth animations
 */

import React, { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ProgressOperation, ProgressConfig, ProgressVariant } from '@/monitoring/progress-indicators-types';
import { useProgressConfig } from '@/monitoring/progress-manager';

interface CircularProgressProps {
  operation: ProgressOperation;
  config?: Partial<ProgressConfig>;
  className?: string;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  showPercentage?: boolean;
  showEta?: boolean;
  animated?: boolean;
  'aria-label'?: string;
}

const VARIANT_COLORS = {
  default: {
    stroke: 'rgb(59 130 246)', // blue-500
    background: 'rgb(229 231 235)', // gray-200
  },
  success: {
    stroke: 'rgb(34 197 94)', // green-500
    background: 'rgb(229 231 235)', // gray-200
  },
  warning: {
    stroke: 'rgb(234 179 8)', // yellow-500
    background: 'rgb(229 231 235)', // gray-200
  },
  error: {
    stroke: 'rgb(239 68 68)', // red-500
    background: 'rgb(229 231 235)', // gray-200
  },
  info: {
    stroke: 'rgb(6 182 212)', // cyan-500
    background: 'rgb(229 231 235)', // gray-200
  },
};

export const CircularProgress: React.FC<CircularProgressProps> = ({
  operation,
  config,
  className,
  size = 120,
  strokeWidth = 8,
  showLabel: propShowLabel,
  showPercentage: propShowPercentage,
  showEta: propShowEta,
  animated = true,
  'aria-label': ariaLabel,
}) => {
  const globalConfig = useProgressConfig();
  const localConfig = { ...globalConfig, ...config };

  const [displayProgress, setDisplayProgress] = useState(operation.progress);
  const [rotation, setRotation] = useState(0);

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
      const timer = setTimeout(() => {
        setDisplayProgress(operation.progress);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setDisplayProgress(operation.progress);
    }
  }, [operation.progress, localConfig.smoothTransitions, animated]);

  // Rotation animation for running state
  useEffect(() => {
    if (animated && operation.status === 'running') {
      const interval = setInterval(() => {
        setRotation(prev => (prev + 1) % 360);
      }, 20);
      return () => clearInterval(interval);
    }
  }, [animated, operation.status]);

  // Calculate SVG dimensions and paths
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate progress offset
  const progress = Math.min(100, Math.max(0, displayProgress));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Get colors for current variant
  const colors = VARIANT_COLORS[variant];

  // Calculate ETA display
  const etaDisplay = useMemo(() => {
    if (!shouldShowEta || !operation.eta) return null;

    const now = new Date();
    const timeRemaining = operation.eta.getTime() - now.getTime();

    if (timeRemaining <= 0) return null;

    const minutes = Math.floor(timeRemaining / (60 * 1000));
    const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }, [operation.eta, shouldShowEta]);

  return (
    <div
      className={cn('inline-flex flex-col items-center justify-center', className)}
      role="progressbar"
      aria-valuenow={Math.round(operation.progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel || `${operation.name} progress`}
    >
      {/* SVG Circle Progress */}
      <div className="relative">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          style={{ transform: `rotate(-90deg) ${rotation ? `rotate(${rotation}deg)` : ''}` }}
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={colors.background}
            strokeWidth={strokeWidth}
            className="dark:stroke-gray-600"
          />

          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn(
              'transition-all duration-300 ease-out',
              animated && operation.status === 'running' && 'transition-all duration-75 ease-linear'
            )}
            style={{
              filter: animated && operation.status === 'running' ? 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))' : undefined,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {shouldShowPercentage && (
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {Math.round(operation.progress)}%
            </div>
          )}

          {shouldShowLabel && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1 max-w-[80%] truncate">
              {operation.name}
            </div>
          )}
        </div>

        {/* Status indicator overlay */}
        {operation.status !== 'running' && (
          <div className="absolute inset-0 flex items-center justify-center">
            {operation.status === 'completed' && (
              <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}

            {operation.status === 'failed' && (
              <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}

            {operation.status === 'paused' && (
              <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}

            {operation.status === 'cancelled' && (
              <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Additional information */}
      <div className="mt-3 text-center">
        {operation.stepName && (
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
            {operation.stepName}
          </div>
        )}

        {etaDisplay && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {etaDisplay}
          </div>
        )}

        {operation.throughput && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {formatThroughput(operation.throughput)}
          </div>
        )}

        {/* Error display */}
        {operation.error && (
          <div className="text-xs text-red-600 dark:text-red-400 mt-2 max-w-[200px] text-center">
            {operation.error.message}
          </div>
        )}
      </div>
    </div>
  );
};

// Mini version for tight spaces
export const CircularProgressMini: React.FC<Omit<CircularProgressProps, 'size' | 'strokeWidth' | 'showLabel'>> = (props) => (
  <CircularProgress
    {...props}
    size={40}
    strokeWidth={3}
    showLabel={false}
    showEta={false}
    className={cn('scale-75', props.className)}
  />
);

// Large version for featured displays
export const CircularProgressLarge: React.FC<Omit<CircularProgressProps, 'size' | 'strokeWidth'>> = (props) => (
  <CircularProgress
    {...props}
    size={200}
    strokeWidth={12}
    showLabel={true}
    showPercentage={true}
  />
);

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
