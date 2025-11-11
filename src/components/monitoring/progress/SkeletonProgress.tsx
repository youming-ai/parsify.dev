/**
 * Skeleton Progress Component
 * Loading skeleton states for different content types with smooth animations
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { ProgressOperation } from '@/monitoring/progress-indicators-types';

interface SkeletonProgressProps {
  type: 'text' | 'card' | 'list' | 'table' | 'custom' | 'avatar' | 'image';
  lines?: number;
  className?: string;
  animated?: boolean;
  width?: string | number;
  height?: string | number;
  'aria-label'?: string;
  operation?: ProgressOperation;
}

const ANIMATION_CLASSES = {
  base: 'animate-pulse',
  shimmer: 'animate-shimmer',
  wave: 'animate-wave',
};

const BASE_SKELETON_CLASS = 'bg-gray-200 dark:bg-gray-700 rounded';

export const SkeletonProgress: React.FC<SkeletonProgressProps> = ({
  type,
  lines = 3,
  className,
  animated = true,
  width,
  height,
  'aria-label': ariaLabel,
  operation,
}) => {
  const animationClass = animated ? ANIMATION_CLASSES.base : '';
  const ariaLabelText = ariaLabel || (operation ? `Loading ${operation.name}...` : 'Loading...');

  const renderSkeleton = () => {
    switch (type) {
      case 'text':
        return <TextSkeleton lines={lines} animated={animated} />;
      case 'card':
        return <CardSkeleton animated={animated} />;
      case 'list':
        return <ListSkeleton items={lines} animated={animated} />;
      case 'table':
        return <TableSkeleton rows={lines} animated={animated} />;
      case 'avatar':
        return <AvatarSkeleton animated={animated} />;
      case 'image':
        return <ImageSkeleton width={width} height={height} animated={animated} />;
      case 'custom':
        return <CustomSkeleton width={width} height={height} animated={animated} />;
      default:
        return <TextSkeleton lines={lines} animated={animated} />;
    }
  };

  return (
    <div
      className={cn('w-full', className)}
      role="status"
      aria-label={ariaLabelText}
      aria-live="polite"
    >
      {operation && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {operation.name}
          </span>
          {operation.progress > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(operation.progress)}%
            </span>
          )}
        </div>
      )}

      {renderSkeleton()}

      {/* Progress overlay if operation is provided */}
      {operation && operation.progress > 0 && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${operation.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Text skeleton component
const TextSkeleton: React.FC<{ lines: number; animated: boolean }> = ({ lines, animated }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 rounded',
            animated && 'animate-pulse',
            'bg-gray-200 dark:bg-gray-700',
            // Vary the width for more realistic appearance
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
};

// Card skeleton component
const CardSkeleton: React.FC<{ animated: boolean }> = ({ animated }) => {
  return (
    <div className={cn(
      'border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3',
      animated && 'animate-pulse'
    )}>
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
      </div>
    </div>
  );
};

// List skeleton component
const ListSkeleton: React.FC<{ items: number; animated: boolean }> = ({ items, animated }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }, (_, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg',
            animated && 'animate-pulse'
          )}
        >
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
          <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0" />
        </div>
      ))}
    </div>
  );
};

// Table skeleton component
const TableSkeleton: React.FC<{ rows: number; animated: boolean }> = ({ rows, animated }) => {
  return (
    <div className="w-full overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
      {/* Header */}
      <div className={cn(
        'grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700',
        animated && 'animate-pulse'
      )}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className={cn(
              'grid grid-cols-4 gap-4 p-4',
              animated && 'animate-pulse'
            )}
          >
            {Array.from({ length: 4 }, (_, j) => (
              <div
                key={j}
                className={cn(
                  'h-3 bg-gray-200 dark:bg-gray-700 rounded',
                  j === 0 ? 'w-3/4' : j === 3 ? 'w-1/2' : 'w-full'
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Avatar skeleton component
const AvatarSkeleton: React.FC<{ animated: boolean }> = ({ animated }) => {
  return (
    <div className="flex items-center space-x-3">
      <div
        className={cn(
          'w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full',
          animated && 'animate-pulse'
        )}
      />
      <div className="space-y-2">
        <div className={cn(
          'h-4 bg-gray-200 dark:bg-gray-700 rounded w-24',
          animated && 'animate-pulse'
        )} />
        <div className={cn(
          'h-3 bg-gray-200 dark:bg-gray-700 rounded w-32',
          animated && 'animate-pulse'
        )} />
      </div>
    </div>
  );
};

// Image skeleton component
const ImageSkeleton: React.FC<{
  width?: string | number;
  height?: string | number;
  animated: boolean;
}> = ({ width = '100%', height = 200, animated }) => {
  return (
    <div
      className={cn(
        'bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center',
        animated && 'animate-pulse'
      )}
      style={{ width, height }}
    >
      <svg
        className="w-12 h-12 text-gray-400 dark:text-gray-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  );
};

// Custom skeleton component
const CustomSkeleton: React.FC<{
  width?: string | number;
  height?: string | number;
  animated: boolean;
}> = ({ width = '100%', height = 20, animated }) => {
  return (
    <div
      className={cn(
        'bg-gray-200 dark:bg-gray-700 rounded',
        animated && 'animate-pulse'
      )}
      style={{ width, height }}
    />
  );
};

// Specialized skeleton components

// Code editor skeleton
export const CodeEditorSkeleton: React.FC<{ animated?: boolean; lines?: number }> = ({
  animated = true,
  lines = 10
}) => {
  return (
    <div className={cn(
      'border border-gray-200 dark:border-gray-700 rounded-lg p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900',
      animated && 'animate-pulse'
    )}>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="flex items-center space-x-2 mb-1">
          <span className="text-gray-400 dark:text-gray-600 select-none">{(i + 1).toString().padStart(2, ' ')}</span>
          <div
            className="bg-gray-200 dark:bg-gray-700 rounded"
            style={{
              width: `${Math.random() * 60 + 20}%`,
              height: '14px'
            }}
          />
        </div>
      ))}
    </div>
  );
};

// Form skeleton
export const FormSkeleton: React.FC<{ animated?: boolean }> = ({ animated = true }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="space-y-2">
          <div className={cn(
            'h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4',
            animated && 'animate-pulse'
          )} />
          <div className={cn(
            'h-10 bg-gray-200 dark:bg-gray-700 rounded',
            animated && 'animate-pulse'
          )} />
        </div>
      ))}

      <div className="flex justify-end space-x-3">
        <div className={cn(
          'h-10 bg-gray-200 dark:bg-gray-700 rounded w-20',
          animated && 'animate-pulse'
        )} />
        <div className={cn(
          'h-10 bg-gray-200 dark:bg-gray-700 rounded w-24',
          animated && 'animate-pulse'
        )} />
      </div>
    </div>
  );
};

// Dashboard skeleton
export const DashboardSkeleton: React.FC<{ animated?: boolean }> = ({ animated = true }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Stats cards */}
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className={cn(
            'border border-gray-200 dark:border-gray-700 rounded-lg p-6',
            animated && 'animate-pulse'
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      ))}

      {/* Chart area */}
      <div className={cn(
        'col-span-full border border-gray-200 dark:border-gray-700 rounded-lg p-6',
        animated && 'animate-pulse'
      )}>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
};

// Shimmer effect skeleton
export const ShimmerSkeleton: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
      {children}
    </div>
  );
};
