/**
 * Progress Overlay Component
 * Full-screen overlay for showing progress during blocking operations
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { ProgressOperation, ProgressConfig } from '@/monitoring/progress-indicators-types';
import { LinearProgress } from './LinearProgress';
import { CircularProgress } from './CircularProgress';
import { useProgressConfig } from '@/monitoring/progress-manager';

interface ProgressOverlayProps {
  operations: ProgressOperation[];
  visible: boolean;
  closable?: boolean;
  config?: Partial<ProgressConfig>;
  className?: string;
  onClose?: () => void;
  title?: string;
  message?: string;
  backdrop?: boolean;
  'aria-label'?: string;
}

export const ProgressOverlay: React.FC<ProgressOverlayProps> = ({
  operations,
  visible,
  closable = false,
  config,
  className,
  onClose,
  title = 'Processing...',
  message,
  backdrop = true,
  'aria-label': ariaLabel,
}) => {
  const globalConfig = useProgressConfig();
  const localConfig = { ...globalConfig, ...config };

  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Handle portal mounting
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle animation states
  useEffect(() => {
    if (visible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!mounted || !shouldRender) return null;

  // Sort operations by priority and status
  const sortedOperations = operations
    .filter(op => op.status !== 'completed' && op.status !== 'failed')
    .sort((a, b) => {
      // Show running operations first
      if (a.status === 'running' && b.status !== 'running') return -1;
      if (b.status === 'running' && a.status !== 'running') return 1;

      // Then by priority
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Finally by progress (most complete first)
      return b.progress - a.progress;
    });

  const primaryOperation = sortedOperations[0];
  const hasMultiple = sortedOperations.length > 1;

  const overlayContent = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        backdrop && 'bg-black/50 dark:bg-black/70',
        'transition-all duration-300',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none',
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || 'Progress overlay'}
      onClick={backdrop && closable ? (e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      } : undefined}
    >
      <div
        className={cn(
          'bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4',
          'transform transition-all duration-300',
          visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-2'
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>

          {closable && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close progress overlay"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Message */}
        {message && (
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
            {message}
          </p>
        )}

        {/* Primary operation */}
        {primaryOperation ? (
          <div className="space-y-6">
            {/* Main progress indicator */}
            <div className="flex flex-col items-center space-y-4">
              <CircularProgress
                operation={primaryOperation}
                config={localConfig}
                size={120}
                showLabel={true}
                showPercentage={true}
                showEta={true}
              />

              <div className="text-center">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {primaryOperation.name}
                </h3>
                {primaryOperation.stepName && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {primaryOperation.stepName}
                  </p>
                )}
              </div>
            </div>

            {/* Linear progress for primary operation */}
            <LinearProgress
              operation={primaryOperation}
              config={localConfig}
              showLabel={false}
              showEta={false}
            />

            {/* Additional operations */}
            {hasMultiple && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Additional operations ({sortedOperations.length - 1})
                </h4>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {sortedOperations.slice(1).map((operation) => (
                    <div key={operation.id} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <CircularProgress
                        operation={operation}
                        size={24}
                        strokeWidth={3}
                        showLabel={false}
                        showPercentage={false}
                        showEta={false}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {operation.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.round(operation.progress)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-center space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              {primaryOperation.allowCancellation && (
                <button
                  onClick={() => {
                    // Cancel the primary operation
                    // This would typically dispatch a cancel action
                    console.log('Cancelling operation:', primaryOperation.id);
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              )}

              {primaryOperation.status === 'paused' && (
                <button
                  onClick={() => {
                    // Resume the primary operation
                    console.log('Resuming operation:', primaryOperation.id);
                  }}
                  className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  Resume
                </button>
              )}
            </div>
          </div>
        ) : (
          // No active operations
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>

            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              All operations completed
            </h3>

            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {message || 'All tasks have been completed successfully.'}
            </p>

            {closable && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(overlayContent, document.body);
};

// Simplified version for single operations
export const ProgressOverlaySimple: React.FC<{
  operation: ProgressOperation;
  visible: boolean;
  config?: Partial<ProgressConfig>;
  onClose?: () => void;
}> = ({ operation, visible, config, onClose }) => {
  return (
    <ProgressOverlay
      operations={[operation]}
      visible={visible}
      closable={!!onClose}
      config={config}
      onClose={onClose}
      title={operation.name}
      message={operation.description}
      backdrop={true}
    />
  );
};

// Minimal version for quick operations
export const ProgressOverlayMinimal: React.FC<{
  operation: ProgressOperation;
  visible: boolean;
  onClose?: () => void;
}> = ({ operation, visible, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!mounted || !shouldRender) return null;

  const overlayContent = (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 min-w-[300px]',
        'transform transition-all duration-200',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0 pointer-events-none'
      )}
    >
      <div className="flex items-start space-x-3">
        <CircularProgress
          operation={operation}
          size={40}
          strokeWidth={3}
          showLabel={false}
          showPercentage={false}
          showEta={false}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {operation.name}
            </h4>

            {onClose && operation.allowCancellation && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Cancel operation"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {operation.stepName && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {operation.stepName}
            </p>
          )}

          <div className="mt-2">
            <LinearProgress
              operation={operation}
              height={4}
              showLabel={false}
              showPercentage={false}
              showEta={false}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlayContent, document.body);
};
