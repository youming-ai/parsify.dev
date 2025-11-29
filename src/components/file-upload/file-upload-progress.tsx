import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type React from 'react';
import type { FileUploadProgress, FileUploadStatus } from './file-upload-types';

interface FileUploadProgressProps {
  /** Upload progress information */
  progress: FileUploadProgress;
  /** Upload status */
  status: FileUploadStatus;
  /** File name */
  fileName: string;
  /** File size */
  fileSize: number;
  /** Whether to show cancel button */
  showCancelButton?: boolean;
  /** Whether to show retry button */
  showRetryButton?: boolean;
  /** Custom class name */
  className?: string;
  /** Event handlers */
  onCancel?: () => void;
  onRetry?: () => void;
}

export const FileUploadProgressIndicator: React.FC<FileUploadProgressProps> = ({
  progress,
  status,
  fileName,
  fileSize,
  showCancelButton = true,
  showRetryButton = true,
  className,
  onCancel,
  onRetry,
}) => {
  const { loaded, total, percentage, speed, timeRemaining } = progress;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return `${formatFileSize(bytesPerSecond)}/s`;
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return (
          <svg
            className="h-5 w-5 animate-pulse text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'uploading':
        return (
          <svg
            className="h-5 w-5 animate-spin text-blue-500"
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
      case 'success':
        return (
          <svg
            className="h-5 w-5 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'error':
        return (
          <svg
            className="h-5 w-5 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'cancelled':
        return (
          <svg
            className="h-5 w-5 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'text-gray-500';
      case 'uploading':
        return 'text-blue-500';
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'cancelled':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  const _getProgressColor = () => {
    switch (status) {
      case 'pending':
        return 'bg-gray-200';
      case 'uploading':
        return 'bg-blue-500';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-400';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className={cn('w-full rounded-lg border border-gray-200 bg-white p-4', className)}>
      <div className="mb-3 flex items-start justify-between">
        <div className="flex min-w-0 flex-1 items-center space-x-3">
          {getStatusIcon()}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-gray-900 text-sm">{fileName}</p>
            <p className="text-gray-500 text-xs">
              {formatFileSize(loaded)} / {formatFileSize(total)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={cn('font-medium text-sm', getStatusColor())}>
            {percentage.toFixed(1)}%
          </span>

          {showCancelButton && status === 'uploading' && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-auto p-1 text-gray-500 hover:text-red-500"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          )}

          {showRetryButton && status === 'error' && onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="h-auto p-1 text-gray-500 hover:text-blue-500"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Progress value={percentage} className="h-2" />

        {(speed || timeRemaining) && status === 'uploading' && (
          <div className="flex justify-between text-gray-500 text-xs">
            {speed && <span>{formatSpeed(speed)}</span>}
            {timeRemaining && <span>{formatTime(timeRemaining)} remaining</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadProgressIndicator;
