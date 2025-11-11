/**
 * Progress Dots Component
 * Animated dots indicator for indefinite loading operations
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ProgressOperation, ProgressConfig } from '@/monitoring/progress-indicators-types';
import { useProgressConfig } from '@/monitoring/progress-manager';

interface ProgressDotsProps {
  operation: ProgressOperation;
  config?: Partial<ProgressConfig>;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dots' | 'pulse' | 'wave' | 'bounce';
  color?: string;
  'aria-label'?: string;
}

const DOT_SIZES = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

const DOT_SPACING = {
  sm: 'space-x-1',
  md: 'space-x-2',
  lg: 'space-x-3',
};

export const ProgressDots: React.FC<ProgressDotsProps> = ({
  operation,
  config,
  className,
  size = 'md',
  variant = 'dots',
  color,
  'aria-label': ariaLabel,
}) => {
  const globalConfig = useProgressConfig();
  const localConfig = { ...globalConfig, ...config };

  const [animationFrame, setAnimationFrame] = useState(0);
  const [isRunning, setIsRunning] = useState(operation.status === 'running');

  // Update animation state
  useEffect(() => {
    setIsRunning(operation.status === 'running');
  }, [operation.status]);

  // Animation loop
  useEffect(() => {
    if (!isRunning || !localConfig.animate) return;

    const interval = setInterval(() => {
      setAnimationFrame(prev => (prev + 1) % 4);
    }, 300);

    return () => clearInterval(interval);
  }, [isRunning, localConfig.animate]);

  const dotColor = color || (operation.status === 'failed'
    ? 'bg-red-500'
    : operation.status === 'completed'
      ? 'bg-green-500'
      : operation.status === 'paused'
        ? 'bg-yellow-500'
        : 'bg-blue-500'
  );

  const dots = Array.from({ length: 3 }, (_, i) => i);

  const renderDots = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className={cn('flex items-center', DOT_SPACING[size])}>
            {dots.map((index) => (
              <div
                key={index}
                className={cn(
                  DOT_SIZES[size],
                  dotColor,
                  'rounded-full transition-all duration-300',
                  isRunning && localConfig.animate && animationFrame === index
                    ? 'scale-125 opacity-100'
                    : 'scale-100 opacity-30'
                )}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <div className={cn('flex items-center', DOT_SPACING[size])}>
            {dots.map((index) => (
              <div
                key={index}
                className={cn(
                  DOT_SIZES[size],
                  dotColor,
                  'rounded-full',
                  isRunning && localConfig.animate && 'animate-pulse'
                )}
                style={{
                  animationDelay: `${index * 200}ms`,
                  animationDuration: '1.5s',
                }}
              />
            ))}
          </div>
        );

      case 'wave':
        return (
          <div className={cn('flex items-center', DOT_SPACING[size])}>
            {dots.map((index) => (
              <div
                key={index}
                className={cn(
                  DOT_SIZES[size],
                  dotColor,
                  'rounded-full transform transition-transform duration-500'
                )}
                style={{
                  transform: isRunning && localConfig.animate
                    ? `translateY(-${Math.sin((animationFrame + index * 2) * 0.5) * 8}px)`
                    : 'translateY(0)',
                }}
              />
            ))}
          </div>
        );

      case 'bounce':
        return (
          <div className={cn('flex items-center', DOT_SPACING[size])}>
            {dots.map((index) => (
              <div
                key={index}
                className={cn(
                  DOT_SIZES[size],
                  dotColor,
                  'rounded-full',
                  isRunning && localConfig.animate && 'animate-bounce'
                )}
                style={{
                  animationDelay: `${index * 150}ms`,
                }}
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
      aria-busy={isRunning}
    >
      {renderDots()}

      {localConfig.showLabel && (
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

// Compact version for inline use
export const ProgressDotsCompact: React.FC<Omit<ProgressDotsProps, 'size' | 'className'>> = (props) => (
  <ProgressDots
    {...props}
    size="sm"
    className="inline-flex"
    config={{ ...props.config, showLabel: false }}
  />
);

// Large version for prominent displays
export const ProgressDotsLarge: React.FC<Omit<ProgressDotsProps, 'size'>> = (props) => (
  <ProgressDots
    {...props}
    size="lg"
  />
);

// Text dots component (inline with text)
export const TextProgressDots: React.FC<{
  text: string;
  loading?: boolean;
  className?: string;
}> = ({ text, loading = true, className }) => {
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setDotCount(prev => (prev + 1) % 4);
    }, 500);

    return () => clearInterval(interval);
  }, [loading]);

  return (
    <span className={cn('inline-flex items-center', className)}>
      {text}
      <span className="ml-1">
        {Array.from({ length: 3 }, (_, i) => (
          <span
            key={i}
            className={cn(
              'inline-block w-1 h-1 bg-current rounded-full mx-0.5 transition-opacity duration-200',
              i < dotCount ? 'opacity-100' : 'opacity-30'
            )}
          />
        ))}
      </span>
    </span>
  );
};

// Typing indicator for chat/messaging
export const TypingIndicator: React.FC<{
  users?: number;
  className?: string;
}> = ({ users = 1, className }) => {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {Array.from({ length: users }, (_, i) => (
        <div key={i} className="flex items-center space-x-1">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
              {String.fromCharCode(65 + i)}
            </span>
          </div>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
          </div>
        </div>
      ))}
    </div>
  );
};

// Loading text with dots
export const LoadingText: React.FC<{
  text?: string;
  className?: string;
  'aria-label'?: string;
}> = ({
  text = 'Loading',
  className,
  'aria-label': ariaLabel = 'Loading content'
}) => {
  return (
    <span
      className={cn('inline-flex items-center', className)}
      role="status"
      aria-label={ariaLabel}
    >
      {text}
      <span className="ml-1 space-x-0.5">
        <span className="inline-block w-1 h-1 bg-current rounded-full animate-pulse" />
        <span className="inline-block w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
        <span className="inline-block w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
      </span>
    </span>
  );
};
